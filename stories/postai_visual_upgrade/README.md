# 后AI研究所 · 思想剧场导演版 2.0

《谁教会机器知道轻重？》增量升级：沿用已合成的四角色音频，新增论证动画、即时倍速、带声录制与本地 MP4 压缩。

**不重新合成、不调用豆包、不需要密钥、不安装 Python 包。原 `theatre_with_doubao.html`、`audio`、`albums`、`manifest.json` 均保留。**

## 1. 最简单的使用方式（Windows）

把本文件夹放到此前配音工程目录中，与 `full_dub.py`、`output_full` 同级：

```text
postai_doubao_four_voice/
  full_dub.py
  .venv/                          # 已有环境，有就复用
  output_full/
    manifest.json
    audio/
    albums/
    theatre_with_doubao.html       # 不覆盖
  postai_visual_upgrade/
    run_windows.bat
    studio.py
    assets/
    README.md
```

双击 `postai_visual_upgrade/run_windows.bat`。程序会校验原配音，生成：

```text
output_full/theatre_director.html
```

随后自动打开本地工作室。请保持命令行窗口开启。

如果没有自动找到 `output_full`，把该文件夹或其中的 `theatre_with_doubao.html` 拖入命令行窗口，再按回车。也可以在 PowerShell 中运行：

```powershell
python .\studio.py --source "D:\你的项目\postai_doubao_four_voice\output_full"
```

这个包的 `.bat` 使用纯 ASCII 与 Windows CRLF 行尾。不会调用 `pip install`，不会修改全局 Python。

macOS / Linux：

```bash
bash run_mac_linux.sh --source /你的项目/output_full
```

## 2. 增强了什么

完整保留原稿 9 幕、176 次发言、205 条字幕及原来的四人声线。按论证位置切换 **25 个概念节点**，不是把一张背景图循环播放：

- 时间窗口与理解、授权、行动的错位。
- 进化、发育、文化、实践四层历史；发现、继承与验证的区分。
- 两种锯齿、伦理判断链、现实后果与模型更新之间的断裂。
- Breeder / Ecosystem、维持网络、不同环境下的谱系分化。
- 竞争压力、扩大授权、加深依赖、更难暂停的反馈循环。
- 可见行为与内部变化；自我描述、自保、隐藏、主观体验的证据边界。
- 生命、道德关切、责任三个不同判断；多样性与共同未来。
- 控制失效、生命史、责任形成的不同时序；开放的结尾。

每个节点有“停下来想”说明和证据边界。所有曲线、网络和倒计时均为概念示意；不把虚构的曲线当作实测，不把意识画成已经发现的事实。原剧本文献与原台词保留，本次不是重新核验原稿所有文献的研究任务。

可切回“人物舞台”；“上个论点 / 下个论点”在 25 个节点之间跳转。手机与竖版视频使用重新排布的图示，不是把横版内容直接缩小。

## 3. 倍速修复

旧版在 `Audio.load()` 前设置播放速度，且改速时重新建立音频。现在：

- 同时设置 `defaultPlaybackRate` 和 `playbackRate`，在音频元数据加载后再次应用。
- 直接修改当前音轨速度，不重播当前句，不重新加载。
- 使用 `preservesPitch` 保持音高；支持原页面的 0.75–3 倍速。
- 音频时间驱动字幕切换、字幕页与进度；暂停时保留音频位置。
- 长发言仍按文本权重分配字幕时间，**不是逐字强制对齐**。视频中的长字幕按页显示，不截断文本。

## 4. 录制与下载

点击“录制视频”，选择：

- 当前整幕、完整九幕，或当前字幕至结尾。
- 横版 1280×720（16:9）或竖版 810×1080（3:4）。
- 小体积 / 均衡 / 清晰三个压缩档位。
- 自动容器（优先 MP4）、MP4 或 WebM，实际可用项由浏览器决定。

录制使用 **Canvas 画布 + 原配音混流**，不采集桌面、摄像头或麦克风，播放器按钮也不会录进去。按当前选定倍速实时录制，不是后台离线渲染。开始前页面会按已有配音长度显示范围时长和目标码率估算体积。

播放暂停与录制暂停联动；到所选范围末尾自动停止。可提前“结束并保存”片段。切到后台会暂停，不会假装在后台继续录完整剧。保持页面在前台，尽量关闭其他占用大量资源的标签；整剧较长时分幕录制更稳妥。

录制完成后先试听生成视频，再下载。**刷新或关闭页面会丢失尚未下载的浏览器录制。** 单次录制达到约 550 MiB 时会安全结束并保留片段，避免无限消耗浏览器内存。

### 本地压缩 MP4

通过启动脚本打开工作室时，程序会查找已有的系统 FFmpeg，或此前音频合成环境中的 `imageio-ffmpeg` 可执行文件。不会联网下载，也不会安装。

找到后，录制结果页出现“压缩成兼容 MP4”按钮：

- 原始录制送到 **127.0.0.1 本机**，不是云端。
- 转码为 H.264 / AAC、`yuv420p`、24 fps、CRF 28，并设置 faststart。
- 文件保存在 `output_full/videos/`，同时提供浏览器下载。
- CRF 控制的是质量；二次编码**不保证一定比原文件更小**。低码率原文件有时已经很小。
- 浏览器原生导出的 MP4 也可能使用 VP9/Opus，不等同于普遍兼容的 H.264/AAC。向外发布优先使用这个本地转码结果。

未找到 FFmpeg 时，原始 MP4/WebM 仍可直接下载，压缩按钮不可用并显示说明。

## 5. 为什么录制要从本地工作室打开

直接双击 HTML 可以播放；但 `file://` 的相对音频路径在部分浏览器中不能可靠进入 Web Audio 混流，可能造成无声录制。因此，有分离音频文件时会要求使用启动脚本打开的本地页面。服务器仅监听 `127.0.0.1`，只服务 `output_full`，不服务包含脚本或凭证的上层目录。

需要单文件离线版时：

```powershell
python .\studio.py --source "D:\项目\output_full" --standalone --build-only
```

额外生成 `theatre_director_all_in_one.html`，把已有音频嵌入页面，体积较大。是否支持直接文件模式下的录制仍取决于浏览器；本地工作室最稳妥。

## 6. 文件与安全

- `studio.py`：校验原配音、构建新页面、启动本地服务、可选本地 FFmpeg 转码。
- `assets/renderer.js`：25 个论证节点与两种画幅的 Canvas 绘制。
- `assets/director.js`：音频播放器、即时倍速、字幕同步、录制与下载。
- `assets/director.css`：响应式界面。
- `assets/theatre_base.html`：备用原剧场；优先使用你已有的 `theatre_with_doubao.html`。
- `tests/test_upgrade.py`：无网络、无 API 调用的构建和路径校验测试。

不要删除原 `audio/`、`manifest.json` 或旧合成缓存。升级包里没有你的真实配音，也没有任何 API 密钥。测试用音轨未打入发布包。

## 7. 技术参考

- HTMLMediaElement playbackRate / defaultPlaybackRate / preservesPitch：
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/defaultPlaybackRate
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch
- Canvas captureStream 与 MediaRecorder 格式检测：
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
- Web Audio 本地音频源与录制混流：
  https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
  https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination
