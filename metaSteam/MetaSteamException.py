'''
A Simple, to be extended Exception class for MetaSteam
@module MetaSteamException
'''

'''
@class MetaSteamException
@purpose A Custom Exception for metaSteam
'''
class MetaSteamException(Exception):
    def __init__(self,message):
        super(MetaSteamException,self).__init__()
        self.message = message
