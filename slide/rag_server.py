import http.server
import socketserver
import json
import re
import os
import urllib.request
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 8000))
INDEX_FILE = os.path.join(os.path.dirname(__file__), "nsca_5th_index.json")

# NVIDIA API Configurations (from nvi_api.py)
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "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")
NVIDIA_MODEL = "openai/gpt-oss-120b"

# Term translation map for Chinese queries
TERM_MAP = {
    "肌梭": "muscle spindle proprioceptor",
    "高爾肌腱": "golgi tendon organ GTO",
    "腱器官": "golgi tendon organ GTO",
    "乳酸": "lactate threshold OBLA",
    "磷酸原": "phosphagen ATP PCr",
    "能量系統": "bioenergetics ATP glycolytic oxidative",
    "週期": "periodization macrocycle mesocycle microcycle",
    "槓桿": "lever fulcrum mechanical advantage moment arm",
    "睪固酮": "testosterone anabolic hormone",
    "生長激素": "growth hormone GH IGF-1",
    "皮質醇": "cortisol catabolic tissue breakdown",
    "柔軟度": "flexibility mobility RAMP warmup",
    "增強式": "plyometric stretch shortening cycle SSC",
    "最大肌力": "1RM 1-repetition maximum load",
    "肥大": "hypertrophy cross sectional area CSA",
    "有氧": "aerobic VO2max cardiac output",
    "心率": "heart rate Karvonen HRR HRmax",
    "敏捷": "agility change of direction COD speed",
    "過度訓練": "overtraining overreaching recovery"
}

print("Loading NSCA 5th Edition Knowledge Base...")
nsca_index = []

def load_index():
    global nsca_index
    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                nsca_index = json.load(f)
            print(f"Loaded {len(nsca_index)} indexed pages into memory.")
        except Exception as e:
            print("Error loading index file:", e)

load_index()

def preprocess_query(query):
    expanded = query
    for zh_term, en_trans in TERM_MAP.items():
        if zh_term in query:
            expanded += " " + en_trans
    return expanded

def rank_chunks(query, week=1, slide_title="", top_k=3):
    if not nsca_index:
        load_index()
    if not nsca_index:
        return []

    expanded = preprocess_query(query)
    keywords = [w.lower() for w in re.findall(r'\w+', expanded) if len(w) > 2]
    if not keywords:
        keywords = ["exercise", "muscle", "strength", "training"]

    scored_entries = []
    for entry in nsca_index:
        text_lower = entry["text"].lower()
        ch_title_lower = entry["chapterTitle"].lower()
        score = 0

        for kw in set(keywords):
            count = text_lower.count(kw)
            if count > 0:
                score += count * 2
            if kw in ch_title_lower:
                score += 5

        if slide_title:
            slide_kws = [w.lower() for w in re.findall(r'\w+', slide_title) if len(w) > 2]
            for skw in slide_kws:
                if skw in text_lower:
                    score += 2

        if score > 0:
            scored_entries.append((score, entry))

    scored_entries.sort(key=lambda x: x[0], reverse=True)
    return [e[1] for e in scored_entries[:top_k]]

def call_nvidia_llm(query, context_text, citations, week=1, slide_num=1, slide_title=""):
    """Call NVIDIA LLM API for natural, conversational study tutoring."""
    system_prompt = (
        "你是一位親切、專業的 NSCA-CSCS 考照隨身 AI 助教。"
        "請用自然、流暢、親切且有條理的繁體中文回答學員的問題，就像在與學員面對面討論指導一樣。"
        "請善用適當標點符號、分段、條列式與粗體強調關鍵字，讓閱讀體驗輕鬆明瞭。"
        "請直接給予解答與考點解析，語氣自然熱情，切勿輸出重複或機械式的系統聲明標籤。"
    )

    user_prompt = (
        f"【學員提問】: {query}\n\n"
        f"【當前學習脈絡】: 第 {week} 週 Slide {slide_num} - {slide_title}\n\n"
        f"【NSCA 原書 5th Edition 參考資料】:\n{context_text}\n\n"
        f"請以親切專業的語氣，為學員解答該問題的核心觀念、考點口訣與實務應用。"
    )

    payload = {
        "model": NVIDIA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1500
    }

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        req = urllib.request.Request(NVIDIA_BASE_URL, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=25) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            llm_reply = res_data["choices"][0]["message"]["content"]
            if "</think>" in llm_reply:
                llm_reply = llm_reply.split("</think>")[-1].strip()
            return llm_reply
    except Exception as e:
        print("NVIDIA LLM API Call Error, falling back to local synthesis:", e)
        return None

def generate_rag_answer(query, week=1, slide_title="", slide_num=1):
    retrieved = rank_chunks(query, week, slide_title, top_k=3)
    is_zh = any("\u4e00" <= c <= "\u9fff" for c in query)

    if not retrieved:
        ans = (
            f"關於「{query}」，這部分的內容建議您對照 NSCA Essentials 5th Edition 相關章節做更深入的複習喔！" if is_zh else
            f"Regarding '{query}', please consult the relevant textbook chapter in NSCA Essentials 5th Edition."
        )
        return {"answer": ans, "citations": []}

    citations = []
    context_blocks = ""
    for r in retrieved:
        citations.append({
            "chapter": r["chapter"],
            "chapterTitle": r["chapterTitle"],
            "page": r["page"],
            "snippet": r["text"][:260] + "..."
        })
        context_blocks += f"- [Chapter {r['chapter']}: {r['chapterTitle']} (p. {r['page']})]: {r['text'][:500]}\n\n"

    llm_answer = call_nvidia_llm(query, context_blocks, citations, week, slide_num, slide_title)

    if llm_answer:
        answer_text = llm_answer
    else:
        main_ref = citations[0]
        answer_text = (
            f"好的！根據 **NSCA Essentials (5th Ed)** 第 {main_ref['chapter']} 章 ({main_ref['chapterTitle']}) 第 {main_ref['page']} 頁的內容：\n\n"
            f"針對您問的 **「{query}」**：\n"
            f"• **重點觀念**：{main_ref['snippet']}\n\n"
            f"💡 這部分正好與您目前在看第 {week} 週 Slide {slide_num} ({slide_title}) 的考點相呼應喔！"
        )

    return {
        "answer": answer_text,
        "citations": citations
    }

class RAGRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_HEAD(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/", "/api/status"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()
            resp = {
                "status": "online",
                "llm": "NVIDIA API (openai/gpt-oss-120b)",
                "indexedPages": len(nsca_index),
                "pdf": "NSCA Essentials of Strength Training & Conditioning (5th Ed)"
            }
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/chat":
            content_len = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_len).decode("utf-8")
            
            try:
                payload = json.loads(post_data)
                query = payload.get("message", "")
                week = payload.get("week", 1)
                slide_num = payload.get("slide", 1)
                slide_title = payload.get("slideTitle", "")

                result = generate_rag_answer(query, week, slide_title, slide_num)

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self._send_cors_headers()
                self.end_headers()
                err_resp = {"error": str(e)}
                self.wfile.write(json.dumps(err_resp, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RAGRequestHandler) as httpd:
        print(f"RAG Server with Conversational LLM running on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    run_server()
