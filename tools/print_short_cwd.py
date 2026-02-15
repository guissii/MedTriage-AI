import os
import ctypes


def short_path(path: str) -> str:
    buf = ctypes.create_unicode_buffer(32768)
    res = ctypes.windll.kernel32.GetShortPathNameW(path, buf, len(buf))
    if res == 0:
        return path
    return buf.value


if __name__ == "__main__":
    print(short_path(os.getcwd()))
