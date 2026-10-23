#!/usr/bin/env python3
"""Offline, incremental upgrade for an existing POST-AI Doubao audio theatre.
No API calls, no credentials, no pip installation. Python 3.10+ standard library.
The optional MP4 encoder reuses an existing FFmpeg installation.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import http.server
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import webbrowser

BASE = Path(__file__).resolve().parent
ASSETS = BASE / 'assets'
PAGE = 'theatre_director.html'
MAX_UPLOAD = 700 * 1024 * 1024

class StudioError(RuntimeError):
    pass

def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def unpack_data(source: str):
    match = re.search(r'\bconst\s+DATA\s*=\s*', source)
    if not match:
        raise StudioError('原剧场文件中没有找到 DATA 剧本。')
    return json.JSONDecoder().raw_decode(source[match.end():])[0]

def source_candidates():
    found=[]
    for base in [Path.cwd(), BASE, BASE.parent, BASE.parent.parent]:
        for p in [base, base/'output_full', base/'postai_doubao_four_voice'/'output_full']:
            if p not in found:
                found.append(p)
    return found

def normalize_source(raw):
    p=Path(str(raw).strip().strip('"').strip("'")).expanduser().resolve()
    if p.is_file():
        p=p.parent
    if not (p/'manifest.json').is_file() and (p/'output_full'/'manifest.json').is_file():
        p=p/'output_full'
    if not (p/'manifest.json').is_file():
        raise StudioError(f'没有找到 manifest.json：{p}\n请选择已合成配音的 output_full 文件夹。')
    return p

def find_source(raw=None, interactive=True):
    if raw:
        return normalize_source(raw)
    candidates=[]
    for p in source_candidates():
        if (p/'manifest.json').is_file() and p.resolve() not in candidates:
            candidates.append(p.resolve())
    if len(candidates)==1:
        return candidates[0]
    if not interactive:
        raise StudioError('未自动定位到唯一的 output_full；请用 --source 指定。')
    if candidates:
        print('检测到多个配音目录，请输入要使用的完整路径：')
        for p in candidates: print('  ',p)
    else:
        print('请把已合成配音的 output_full 文件夹，或其中的 theatre_with_doubao.html 拖入窗口。')
    return normalize_source(input('配音目录：').strip())

def safe_audio_path(root: Path, value: str):
    if value.startswith('data:audio/'):
        return None
    # Never fetch remote audio and never read arbitrary files outside the output folder.
    if re.match(r'^\w+:',value) or value.startswith(('/', '\\')):
        raise StudioError('配音清单含非本地音频路径，已停止：'+value[:90])
    p=(root/value).resolve()
    if not p.is_relative_to(root.resolve()):
        raise StudioError('配音路径越出 output_full，已停止。')
    if not p.is_file():
        raise StudioError('缺少已有配音文件：'+str(p))
    return p

def remove_old_bridge(source):
    def fix(match):
        code=match.group(1)
        if 'Four-character PREGENERATED audio bridge' in code:
            return ''
        if '__POSTAI_DIRECTOR_BEGIN__' in code:
            return ''
        return match.group(0)
    return re.sub(r'<script\b[^>]*>([\s\S]*?)</script>',fix,source,flags=re.I)

def render_page(base_html, rounds, title='导演版 · 后AI思想剧场'):
    base_html=remove_old_bridge(base_html)
    css=(ASSETS/'director.css').read_text(encoding='utf-8')
    renderer=(ASSETS/'renderer.js').read_text(encoding='utf-8')
    player=(ASSETS/'director.js').read_text(encoding='utf-8')
    payload=json.dumps(rounds,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
    player=player.replace('__ROUNDS_JSON__',payload)
    base_html=re.sub(r'<title>[^<]*</title>',f'<title>{title}</title>',base_html,count=1)
    base_html=base_html.replace('</head>','<style id="postai-director-css">\n'+css+'\n</style>\n</head>')
    insert='<script>\n// __POSTAI_DIRECTOR_BEGIN__\n'+renderer+'\n'+player+'\n</script>\n'
    return base_html.replace('</body>',insert+'</body>')

def build(root: Path, standalone=False):
    manifest=read_json(root/'manifest.json')
    rounds=manifest.get('rounds')
    if not isinstance(rounds,list) or not rounds:
        raise StudioError('manifest.json 缺少 rounds 配音清单。')
    basepath=root/'theatre_with_doubao.html'
    if not basepath.is_file():
        basepath=root.parent/'theatre_base.html'
    if not basepath.is_file():
        basepath=ASSETS/'theatre_base.html'
    original=basepath.read_text(encoding='utf-8')
    data=unpack_data(original)
    indices=[];validated=[];total=0.0
    for r in rounds:
        r=dict(r)
        if not isinstance(r.get('cue_indices'),list) or not r['cue_indices']:
            raise StudioError('某段配音没有字幕索引，无法可靠同步。')
        indices.extend(r['cue_indices'])
        if not isinstance(r.get('duration'),(float,int)) or r['duration']<=0:
            raise StudioError('配音时长缺失，请保留此前生成的完整 manifest.json。')
        safe_audio_path(root,r['audio'])
        total+=r['duration'];validated.append(r)
    if sorted(indices)!=list(range(len(data['cues']))):
        raise StudioError('配音清单存在缺失或重复字幕；未改动原文件。')
    output=root/PAGE
    temp=output.with_suffix('.tmp.html')
    temp.write_text(render_page(original,validated),encoding='utf-8')
    os.replace(temp,output)
    if standalone:
        packed=[]
        for r in validated:
            item=dict(r)
            p=safe_audio_path(root,r['audio'])
            if p is not None:
                item['audio']='data:audio/mpeg;base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
            packed.append(item)
        (root/'theatre_director_all_in_one.html').write_text(render_page(original,packed),encoding='utf-8')
    report={'version':'2.0.0','audio_turns':len(rounds),'cues':len(indices),'seconds':round(total,2),
            'original_modified':False,'new_audio_generated':False,'output':PAGE}
    (root/'director_upgrade_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return output,report

def find_ffmpeg(root: Path):
    candidates=[]
    env=os.getenv('IMAGEIO_FFMPEG_EXE')
    if env:candidates.append(Path(env))
    exe=shutil.which('ffmpeg')
    if exe:candidates.append(Path(exe))
    try:
        import imageio_ffmpeg  # Optional, reuse an existing installation. No download.
        candidates.append(Path(imageio_ffmpeg.get_ffmpeg_exe()))
    except (ImportError,RuntimeError):
        pass
    for p in [root,root.parent,root.parent.parent,BASE,BASE.parent]:
        for pattern in ['.venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg*.exe',
                        '.venv/lib/python*/site-packages/imageio_ffmpeg/binaries/ffmpeg*',
                        'venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg*.exe']:
            candidates.extend(p.glob(pattern))
    for p in candidates:
        if not p.is_file():continue
        try:
            test=subprocess.run([str(p),'-version'],capture_output=True,timeout=8)
            if test.returncode==0:return str(p.resolve())
        except (OSError,subprocess.TimeoutExpired):
            pass
    return None

class LocalServer(http.server.ThreadingHTTPServer):
    daemon_threads=True
    allow_reuse_address=True

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,request,client_address,server):
        super().__init__(request,client_address,server,directory=str(server.root))
    def log_message(self,fmt,*args):
        # Do not log tokens, request bodies, or user audio paths.
        if str(args[1] if len(args)>1 else '') not in ('200','304'):
            super().log_message(fmt,*args)
    def local_request(self):
        host=self.headers.get('Host','')
        return host in {f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'}
    def send_json(self,obj,status=200):
        data=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store')
        self.end_headers();self.wfile.write(data)
    def do_GET(self):
        if not self.local_request():
            self.send_error(403);return
        if urllib.parse.urlsplit(self.path).path=='/__postai/config':
            self.send_json({'application':'postai-director','token':self.server.token,
                            'ffmpeg':bool(self.server.ffmpeg),'version':'2.0.0'});return
        super().do_GET()
    def do_POST(self):
        if not self.local_request() or urllib.parse.urlsplit(self.path).path!='/__postai/transcode':
            self.send_json({'error':'不允许此请求。'},403);return
        token=self.headers.get('X-PostAI-Token','')
        if not secrets.compare_digest(token,self.server.token):
            self.send_json({'error':'本机会话凭证无效，请刷新工作室页面。'},403);return
        origin=self.headers.get('Origin')
        allowed={f'http://127.0.0.1:{self.server.server_port}',f'http://localhost:{self.server.server_port}'}
        if origin and origin not in allowed:
            self.send_json({'error':'仅允许本机工作室发起转换。'},403);return
        if not self.server.ffmpeg:
            self.send_json({'error':'未找到现有 FFmpeg；不会自动安装依赖。'},400);return
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=MAX_UPLOAD:raise StudioError('视频为空，或超过单次 700 MiB 的安全限制。')
            if not self.server.convert_lock.acquire(blocking=False):
                self.send_json({'error':'已有一段视频正在转换，请等该操作完成。'},409);return
            tempdir=Path(tempfile.mkdtemp(prefix='postai-video-'))
            try:
                ext=self.headers.get('X-PostAI-Container','webm')
                if ext not in ('mp4','webm'):raise StudioError('未知的视频容器。')
                inp=tempdir/('input.'+ext)
                with inp.open('wb') as f:
                    remaining=length
                    while remaining:
                        data=self.rfile.read(min(1024*1024,remaining))
                        if not data:raise StudioError('上传中断，原始浏览器录制仍可下载。')
                        f.write(data);remaining-=len(data)
                outdir=self.server.root/'videos';outdir.mkdir(exist_ok=True)
                name='postai_compact_'+time.strftime('%Y%m%d_%H%M%S')+'_'+secrets.token_hex(3)+'.mp4'
                out=outdir/name
                cmd=[self.server.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(inp),
                     '-map','0:v:0','-map','0:a:0?','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2',
                     '-c:v','libx264','-crf','28','-preset','medium','-pix_fmt','yuv420p','-r','24',
                     '-c:a','aac','-b:a','96k','-movflags','+faststart',str(out)]
                result=subprocess.run(cmd,capture_output=True,timeout=7200)
                if result.returncode or not out.is_file() or out.stat().st_size<100:
                    out.unlink(missing_ok=True)
                    raise StudioError('FFmpeg 转换失败：'+result.stderr.decode('utf-8',errors='replace')[-700:])
                self.send_json({'url':'videos/'+name,'filename':name,'bytes':out.stat().st_size})
            finally:
                shutil.rmtree(tempdir,ignore_errors=True)
                self.server.convert_lock.release()
        except (ValueError,StudioError,subprocess.TimeoutExpired,OSError) as e:
            try:self.send_json({'error':str(e)},400)
            except (BrokenPipeError,ConnectionResetError):pass

def serve(root: Path,port=0,open_browser=True):
    server=LocalServer(('127.0.0.1',port),Handler)
    server.root=root;server.token=secrets.token_urlsafe(32);server.ffmpeg=find_ffmpeg(root)
    server.convert_lock=threading.Lock()
    url=f'http://127.0.0.1:{server.server_port}/{PAGE}'
    print('\n本地工作室：'+url)
    print('FFmpeg：'+('已找到，可压缩为 H.264 / AAC MP4。' if server.ffmpeg else '未找到；仍可直接下载浏览器录制的视频。'))
    print('服务只监听本机，不连接豆包，不向外上传。请保持本窗口开启。')
    print('按 Ctrl+C 停止本地服务。\n')
    if open_browser:threading.Timer(.7,lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:print('\n工作室已关闭。原始配音和原版 HTML 均保留。')
    finally:server.server_close()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',help='原来的 output_full 文件夹，或其中的 HTML/manifest 文件')
    parser.add_argument('--build-only',action='store_true',help='只生成新 HTML，不启动本地服务器')
    parser.add_argument('--standalone',action='store_true',help='另外嵌入全部音频，生成体积更大的单文件 HTML')
    parser.add_argument('--port',type=int,default=0,help='本地端口，0 自动选择空闲端口')
    parser.add_argument('--no-browser',action='store_true')
    parser.add_argument('--preview',type=Path,help='开发用途：生成不含配音的动画预览')
    args=parser.parse_args()
    try:
        if args.preview:
            p=args.preview.resolve();p.parent.mkdir(parents=True,exist_ok=True)
            p.write_text(render_page((ASSETS/'theatre_base.html').read_text(encoding='utf-8'),[],
                                    '无声动画预览 · 后AI思想剧场'),encoding='utf-8')
            print(p);return 0
        print('POST-AI / DIRECTOR EDITION 2.0\n增量升级：不合成新音频，不安装 Python 包，不修改原文件。\n')
        root=find_source(args.source)
        output,report=build(root,args.standalone)
        print(f'已校验 {report["audio_turns"]} 段配音 / {report["cues"]} 段字幕。')
        print('已生成：'+str(output))
        if args.standalone:print('已额外生成：theatre_director_all_in_one.html')
        if not args.build_only:serve(root,args.port,not args.no_browser)
        return 0
    except (StudioError,OSError,json.JSONDecodeError,ValueError) as e:
        print('\n未完成：'+str(e),file=sys.stderr);return 1

if __name__=='__main__':
    raise SystemExit(main())
