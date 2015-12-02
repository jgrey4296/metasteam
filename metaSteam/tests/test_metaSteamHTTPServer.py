import unittest
from metaSteam import metaSteamMicro

class TestFirstAttempt(unittest.TestCase):

    def test_initial(self):
        print("Testing foo")
        print(metaSteamMicro)
        self.assertEqual('foo'.upper(), 'FOO')

    def test_second(self):
        print("testing second")
        self.assertEqual('foo', 'foo')

    def test_third(self):
        self.assertTrue(1==1)
        
if __name__ == '__main__':
    unittest.main()
