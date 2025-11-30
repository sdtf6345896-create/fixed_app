#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
待辦事項管理器 - 診斷與啟動工具
"""

import os
import sys
import subprocess
import time
import socket

def check_port(port=5000):
    """檢查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_dependencies():
    """檢查依賴是否安裝"""
    print("=" * 50)
    print("檢查依賴...")
    print("=" * 50)
    
    try:
        import flask
        print(f"✅ Flask 已安裝 (版本: {flask.__version__})")
        return True
    except ImportError:
        print("❌ Flask 未安裝")
        print("\n請執行以下命令安裝:")
        print("pip install flask")
        return False

def check_files():
    """檢查必要檔案是否存在"""
    print("\n" + "=" * 50)
    print("檢查檔案...")
    print("=" * 50)
    
    files = {
        'app.py': '主程式',
        'templates/index.html': '前端頁面',
        'static/app.js': 'JavaScript檔案'
    }
    
    all_exist = True
    for file, desc in files.items():
        if os.path.exists(file):
            print(f"✅ {desc}: {file}")
        else:
            print(f"❌ 缺少{desc}: {file}")
            all_exist = False
    
    return all_exist

def start_server():
    """啟動伺服器"""
    print("\n" + "=" * 50)
    print("啟動伺服器...")
    print("=" * 50)
    
    if check_port():
        print("⚠️  端口 5000 已被占用")
        response = input("是否要終止舊進程? (y/n): ")
        if response.lower() == 'y':
            if sys.platform == 'win32':
                os.system('taskkill /F /IM python.exe /FI "WINDOWTITLE eq Flask*"')
            else:
                os.system('pkill -f "python.*app.py"')
            time.sleep(2)
    
    print("\n🚀 正在啟動 Flask 伺服器...")
    print("📍 網址: http://127.0.0.1:5000")
    print("⌨️  按 Ctrl+C 停止伺服器\n")
    print("-" * 50)
    
    try:
        subprocess.run(['python', 'app.py'])
    except KeyboardInterrupt:
        print("\n\n👋 伺服器已停止")

def main():
    print("""
╔════════════════════════════════════════════════╗
║      待辦事項管理器 - 診斷與啟動工具           ║
╚════════════════════════════════════════════════╝
    """)
    
    # 檢查依賴
    if not check_dependencies():
        sys.exit(1)
    
    # 檢查檔案
    if not check_files():
        print("\n❌ 缺少必要檔案,請確認檔案結構完整")
        sys.exit(1)
    
    # 啟動伺服器
    print("\n✅ 所有檢查通過!")
    input("\n按 Enter 鍵啟動伺服器...")
    start_server()

if __name__ == '__main__':
    main()
