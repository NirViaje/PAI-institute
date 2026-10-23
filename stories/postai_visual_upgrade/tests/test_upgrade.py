"""Offline build checks. These tests intentionally use non-playable fake MP3 bytes."""
import hashlib,json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import studio
class UpgradeTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)/'output_full';(self.root/'audio').mkdir(parents=True)
  self.base=(studio.ASSETS/'theatre_base.html').read_text(encoding='utf-8')
  self.data=studio.unpack_data(self.base);self.rounds=[]
  for n,b in enumerate(self.data['blocks']):
   path=f'audio/turn_{n:04d}.mp3';(self.root/path).write_bytes(b'TEST ONLY - NOT AN AUDIO RECORDING')
   self.rounds.append({'block':n,'role':b['speaker'],'chapter':b['chapter'],'audio':path,'duration':1,
       'cue_indices':[i for i,c in enumerate(self.data['cues']) if c['group']==n]})
  self.write_manifest();(self.root/'theatre_with_doubao.html').write_text(self.base,encoding='utf-8')
 def write_manifest(self): (self.root/'manifest.json').write_text(json.dumps({'rounds':self.rounds}),encoding='utf-8')
 def tearDown(self):self.tmp.cleanup()
 def test_complete_build_preserves_original(self):
  before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in self.root.rglob('*') if p.is_file()}
  path,r=studio.build(self.root);self.assertEqual(r['cues'],205);self.assertEqual(r['audio_turns'],176)
  self.assertTrue(path.is_file());self.assertNotIn('__ROUNDS_JSON__',path.read_text(encoding='utf-8'))
  self.assertTrue(all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in before.items()))
 def test_missing_audio_stops(self):
  (self.root/self.rounds[0]['audio']).unlink()
  with self.assertRaises(studio.StudioError):studio.build(self.root)
 def test_duplicate_cue_stops(self):
  self.rounds[0]['cue_indices'].append(1);self.write_manifest()
  with self.assertRaises(studio.StudioError):studio.build(self.root)
 def test_path_traversal_stops(self):
  with self.assertRaises(studio.StudioError):studio.safe_audio_path(self.root,'../../secret.txt')
 def test_remote_audio_stops(self):
  with self.assertRaises(studio.StudioError):studio.safe_audio_path(self.root,'https://example.com/audio.mp3')
 def test_normalize_html_path(self):
  self.assertEqual(studio.normalize_source(self.root/'theatre_with_doubao.html'),self.root)
 def test_strip_original_bridge(self):
  s=self.base.replace('</body>','<script>// Four-character PREGENERATED audio bridge\nconst rounds=[];</script></body>')
  self.assertNotIn('const rounds=[]',studio.remove_old_bridge(s))
 def test_standalone_embeds(self):
  studio.build(self.root,standalone=True)
  self.assertIn('data:audio/mpeg;base64,',(self.root/'theatre_director_all_in_one.html').read_text(encoding='utf-8'))
if __name__=='__main__':unittest.main(verbosity=2)
