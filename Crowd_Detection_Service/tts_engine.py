import sys
import base64
import os
from gtts import gTTS

def generate_tts(text, lang_code, output_path):
    try:
        # Use gTTS (Google Text-to-Speech)
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(output_path)
        
        with open(output_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
        
        print(f"data:audio/mpeg;base64,{encoded}")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts_engine.py <text> <lang_code> <temp_file>")
        sys.exit(1)
        
    text = sys.argv[1]
    lang = sys.argv[2]
    tmp = sys.argv[3]
    generate_tts(text, lang, tmp)
