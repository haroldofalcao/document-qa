import json
import urllib.request
import re
import sys

def main():
    try:
        with open("Topologia_Aplicacao.md", "r", encoding="utf-8") as f:
            text = f.read()
        
        match = re.search(r'```mermaid\n(.*?)\n```', text, re.DOTALL)
        if not match:
            print("No mermaid block found")
            return
            
        mermaid_code = match.group(1).strip()
        
        req = urllib.request.Request(
            'https://kroki.io/mermaid/png',
            data=json.dumps({"diagram_source": mermaid_code}).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Accept': 'image/png', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'},
            method='POST'
        )
        
        with urllib.request.urlopen(req) as resp:
            image_data = resp.read()
            with open("Topologia_Aplicacao.png", "wb") as f:
                f.write(image_data)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
