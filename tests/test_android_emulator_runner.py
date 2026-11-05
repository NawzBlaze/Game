import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('emulator_runner', Path(__file__).resolve().parents[1] / 'tools/run_android_emulator_tests.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class RunnerSafetyTests(unittest.TestCase):
    def test_one_emulator_allowed(self):
        self.assertEqual(runner.select_emulator('List of devices attached\nemulator-5554\tdevice\n'), 'emulator-5554')

    def test_physical_offline_empty_or_multiple_refused(self):
        for rows in ['', 'phone123\tdevice', 'emulator-5554\toffline', 'emulator-5554\tdevice\nphone123\tdevice', 'emulator-5554\tdevice\nemulator-5556\tdevice']:
            with self.subTest(rows=rows), self.assertRaises(RuntimeError):
                runner.select_emulator('List of devices attached\n' + rows)

    def test_success_requires_both_tests_and_completion_code(self):
        self.assertTrue(runner.tests_passed('OK (2 tests)\nINSTRUMENTATION_CODE: -1\n'))
        for text in ['OK (1 test)\nINSTRUMENTATION_CODE: -1', 'OK (2 tests)', 'FAILURES!!!\nINSTRUMENTATION_CODE: -1', 'INSTRUMENTATION_FAILED: crashed', 'OK (2 tests)\nINSTRUMENTATION_CODE: -1\nshortMsg=Process crashed']:
            with self.subTest(text=text):
                self.assertFalse(runner.tests_passed(text))


if __name__ == '__main__':
    unittest.main()
