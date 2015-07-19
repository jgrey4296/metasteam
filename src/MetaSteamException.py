
class MetaSteamException(Exception):
    def __init__(self,message):
        super(MetaSteamException,self).__init__()
        self.message = message
