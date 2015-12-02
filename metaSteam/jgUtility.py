'''
A Collection of utility functions, primarily dealing with unicode and string conversion
@module jgUtility
'''

import linecache
import sys

'''
@function _if_number_get_string
@purpose convert a number to a string
'''
def _if_number_get_string(number):
    converted_str = number
    if isinstance(number, int) or \
        isinstance(number, float):
        converted_str = str(number)
    return converted_str

'''
@function getInt
@purpose convert a string to an int
'''
def getInt(string):
    try:
        print "Int-i-fying"
        return int(string)
    except:
        print "Unable to convert"
        return string

'''
@function get_unicode
@purpose convert input to unicode
'''
def get_unicode(strOrUnicode, encoding='utf-8'):
    strOrUnicode = _if_number_get_string(strOrUnicode)
    if isinstance(strOrUnicode, unicode):
        return strOrUnicode
    return unicode(strOrUnicode, encoding, errors='ignore')

'''
@function get_string
@purpose convert input to string
'''
def get_string(strOrUnicode, encoding='utf-8'):
    strOrUnicode = _if_number_get_string(strOrUnicode)
    if isinstance(strOrUnicode, unicode):
        return strOrUnicode.encode(encoding)
    return strOrUnicode

'''
@function PrintException
@purpose print a specific formatted exception
@deprecated most likely
'''
def PrintException():
    exc_type, exc_obj, tb = sys.exc_info()
    f = tb.tb_frame
    lineno = tb.tb_lineno
    filename = f.f_code.co_filename
    linecache.checkcache(filename)
    line = linecache.getline(filename, lineno, f.f_globals)
    print 'EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, lineno, line.strip(), exc_obj)
                                
