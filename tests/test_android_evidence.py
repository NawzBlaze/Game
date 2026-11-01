"""Host-only mocked tests. Not a Windows, real ADB or physical-phone validation."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('evidence',ROOT/'tools/collect_android_evidence.py')
evidence=importlib.util.module_from_spec(spec)
spec.loader.exec_module(evidence)

class Process:
    def __init__(self): self.running=True; self.terminated=False; self.killed=False
    def poll(self): return None if self.running else 0
    def terminate(self): self.terminated=True;self.running=False
    def wait(self,timeout=None): return 0
    def kill(self): self.killed=True;self.running=False

class EvidenceTests(unittest.TestCase):
    def test_authorized_device_selection_is_explicit(self):
        text='List of devices attached\noriginal device product:test\nlocked unauthorized\nother offline\n'
        self.assertEqual(evidence.select_device(text),'original')
        with self.assertRaises(ValueError):evidence.select_device('locked unauthorized\n')
        with self.assertRaises(ValueError):evidence.select_device('a device\nb device\n')
        self.assertEqual(evidence.select_device('a device\nb device\n','b'),'b')
        with self.assertRaises(ValueError):evidence.select_device(text,'locked')

    def test_snapshot_and_live_are_read_only(self):
        calls=[]
        def run(command,**kwargs):
            calls.append(command);return subprocess.CompletedProcess(command,0,'fixture output','')
        process=Process()
        def launch(command,**kwargs):calls.append(command);return process
        with tempfile.TemporaryDirectory() as temp:
            c=evidence.Collector('adb','private-serial',temp,run)
            c.snapshot();c.live(prompt=lambda _:None,launcher=launch)
            self.assertEqual(calls[0][3:5],['logcat','-d'],'existing logs must be captured first')
            self.assertEqual(len(c.status),len(evidence.SNAPSHOT)+len(evidence.AFTER))
            for command in calls:
                args=command[3:]
                self.assertIn(args[0],['logcat','shell'])
                if args[0]=='logcat':self.assertNotIn('-c',args)
                if args[0]=='shell':self.assertIn(args[1],['date','getprop','dumpsys','pm'])
                if args[:2]==['shell','pm']:self.assertEqual(args[2:4],['path',evidence.PACKAGE])
                self.assertFalse(any(x in args for x in ['install','uninstall','clear','force-stop','am','monkey','reboot','pull']))
            self.assertTrue(process.terminated);self.assertFalse(process.killed)
            status=json.loads((Path(temp)/'capture-status.json').read_text())
            self.assertNotIn('private-serial',json.dumps(status))
            self.assertTrue((Path(temp)/'SUMMARY-TO-SHARE.txt').exists())

    def test_capture_failures_are_recorded_not_invented(self):
        with tempfile.TemporaryDirectory() as temp:
            def unsupported(command,**kwargs):return subprocess.CompletedProcess(command,1,'','unsupported')
            c=evidence.Collector('adb','serial',temp,unsupported)
            c.capture('exit.txt',['shell','dumpsys','activity','exit-info',evidence.PACKAGE])
            self.assertEqual(c.status[0]['exitCode'],1)
            self.assertIn('unsupported',(Path(temp)/'exit.txt').read_text())

    def test_interrupt_stops_only_local_capture(self):
        process=Process()
        def interrupt(_):raise KeyboardInterrupt()
        with tempfile.TemporaryDirectory() as temp:
            c=evidence.Collector('adb','serial',temp)
            with self.assertRaises(KeyboardInterrupt):c.live(prompt=interrupt,launcher=lambda *a,**k:process)
            self.assertTrue(process.terminated)

    def test_cli_no_device_creates_no_evidence(self):
        with tempfile.TemporaryDirectory() as temp,patch.object(evidence.subprocess,'run',return_value=subprocess.CompletedProcess([],0,'List of devices attached\n','')):
            dest=Path(temp)/'not-created'
            self.assertEqual(evidence.main(['--adb','fixture-adb','--output',str(dest),'--snapshot-only']),1)
            self.assertFalse(dest.exists())

    def test_cli_does_not_overwrite_existing_directory(self):
        with tempfile.TemporaryDirectory() as temp,patch.object(evidence.subprocess,'run',return_value=subprocess.CompletedProcess([],0,'original device\n','')):
            marker=Path(temp)/'keep.txt';marker.write_text('existing')
            self.assertEqual(evidence.main(['--adb','fixture-adb','--output',temp,'--snapshot-only']),1)
            self.assertEqual(marker.read_text(),'existing')

if __name__=='__main__':unittest.main()
