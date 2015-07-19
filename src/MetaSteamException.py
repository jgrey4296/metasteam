## A Simple, to be extended Exception class for MetaSteam
# @module MetaSteamException
#
#
#

class MetaSteamException(Exception):
    def __init__(self,message):
        super(MetaSteamException,self).__init__()
        self.message = message
