import unittest
from metaSteam.SteamProfileScraper import SteamProfileScraper

class TestFirstAttempt(unittest.TestCase):

    def test_ctor(self):
        sps = SteamProfileScraper("belial4296")
        self.assertEqual(sps.profileName,'belial4296')

    def test_webRequest(self):
        pass

    def test_profileExtraction(self):
        pass

    def test_scrape(self):
        pass
        
if __name__ == '__main__':
    unittest.main()
