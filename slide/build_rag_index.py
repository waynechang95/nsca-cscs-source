import os
import json
import re
from pypdf import PdfReader

pdf_path = r"d:\DesktopC\NSCA\Essentials_of_Strength_Training_and_Conditioning_5th_Edition.pdf"
output_index_path = r"d:\DesktopC\NSCA\slide\nsca_5th_index.json"

chapter_boundaries = [
    (1, "Structure and Function of Body Systems", 38, 103),
    (2, "Biomechanics of Resistance Exercise", 104, 173),
    (3, "Bioenergetics of Exercise and Training", 174, 226),
    (4, "Endocrine Responses to Resistance Exercise and Training", 227, 280),
    (5, "Adaptations to Anaerobic Training", 281, 338),
    (6, "Adaptations to Aerobic Training", 339, 383),
    (7, "Age-Related Differences and Their Implications for Resistance Training", 384, 437),
    (8, "Sex-Related Differences and Their Implications for Resistance Training", 438, 464),
    (9, "Psychological Foundations of Performance", 465, 535),
    (10, "Basic Nutritional Factors Affecting Health", 536, 612),
    (11, "Nutrition Strategies for Maximizing Performance", 613, 658),
    (12, "Performance-Enhancing Substances and Methods", 659, 728),
    (13, "Principles of Test Selection and Administration", 729, 763),
    (14, "Administration, Scoring, and Interpretation of Selected Tests", 764, 853),
    (15, "Performance Preparation, Mobility, and Flexibility", 854, 946),
    (16, "Exercise Technique for Free Weight and Machine Training", 947, 1087),
    (17, "Exercise Technique for Alternative Modes and Nontraditional Implement Training", 1088, 1185),
    (18, "Program Design for Resistance Training", 1186, 1259),
    (19, "Program Design and Technique for Plyometric Training", 1260, 1397),
    (20, "Program Design and Technique for Speed and Agility Training", 1398, 1511),
    (21, "Program Design and Technique for Aerobic Endurance and Metabolic Training", 1512, 1578),
    (22, "Periodization", 1579, 1629),
    (23, "Rehabilitation, Reconditioning, and Medical Issues", 1630, 1678),
    (24, "Overreaching, Overtraining, and Recovery", 1679, 1726),
    (25, "Facility Design, Layout, and Organization", 1727, 1774),
    (26, "Facility Policies, Procedures, and Legal Issues", 1775, 1819),
]

def get_chapter_info(page_num):
    for ch_num, ch_title, start_p, end_p in chapter_boundaries:
        if start_p <= page_num <= end_p:
            return ch_num, ch_title
    return 0, "General Knowledge"

def build_index():
    print(f"Opening PDF: {pdf_path}")
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"Total PDF pages: {total_pages}")

    index_data = []

    for page_idx in range(37, min(1820, total_pages)):
        page_num = page_idx + 1
        page_obj = reader.pages[page_idx]
        text = page_obj.extract_text() or ""
        
        # Clean text
        text_clean = re.sub(r'\s+', ' ', text).strip()
        if len(text_clean) < 50:
            continue

        ch_num, ch_title = get_chapter_info(page_num)

        # Create chunk entry
        entry = {
            "page": page_num,
            "chapter": ch_num,
            "chapterTitle": ch_title,
            "text": text_clean[:1500]  # Store up to 1500 chars per page
        }
        index_data.append(entry)

        if page_num % 200 == 0:
            print(f"Processed {page_num} pages...")

    print(f"Total indexed pages: {len(index_data)}")
    with open(output_index_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Index successfully written to: {output_index_path}")

if __name__ == "__main__":
    build_index()
