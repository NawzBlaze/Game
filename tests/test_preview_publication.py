"""Publication guards; fixtures are not signed APK/device approval."""
import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'tools/publish_verified_preview.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
class PublicationTests(unittest.TestCase):
 def setUp(self):
  self.run={'conclusion':'success','head_branch':'arena/2ae7d624-game','head_sha':'a'*40,'path':'.github/workflows/android-build-device.yml'}
  self.jobs=[{'name':n,'conclusion':'success'} for n in ['build','emulator (33)','emulator (36)']]
 def test_verified_run(self):p.validate_run(self.run,self.jobs,'arena/2ae7d624-game')
 def test_failed_or_wrong_branch_or_workflow_rejected(self):
  for changes in [{'conclusion':'failure'},{'head_branch':'main'},{'path':'other.yml'},{'head_sha':'bad'}]:
   with self.assertRaises(ValueError):p.validate_run({**self.run,**changes},self.jobs,'arena/2ae7d624-game')
 def test_missing_or_failed_emulator_rejected(self):
  with self.assertRaises(ValueError):p.validate_run(self.run,self.jobs[:-1],'arena/2ae7d624-game')
  with self.assertRaises(ValueError):p.validate_run(self.run,[*self.jobs,{'name':'extra','conclusion':'failure'}],'arena/2ae7d624-game')
 def test_missing_or_stable_artifact_rejected(self):
  with self.assertRaises(ValueError):p.validate_files(Path('/missing-preview'),{'version':'1.0.0'})
  with self.assertRaises(ValueError):p.validate_files(Path('/missing-preview'),{'version':'1.0.0-rc.3'})
if __name__=='__main__':unittest.main()
