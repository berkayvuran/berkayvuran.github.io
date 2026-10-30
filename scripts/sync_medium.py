#!/usr/bin/env python3
"""
Medium RSS -> blog.html otomatik senkronizasyon scripti.
Yeni makaleleri tespit eder ve pages/blog.html'in başına ekler.
"""

import re
import sys
import urllib.request
from datetime import datetime
from html.parser import HTMLParser

import feedparser

MEDIUM_RSS = "https://medium.com/feed/@berkayvuran"
BLOG_HTML = "pages/blog.html"
MEDIUM_LOGO = "../assets/images/blog-headers/medium-logo.webp"
INSERT_AFTER = '<ul class="blog-posts-list">'
COVER_DIR = "assets/images/blog-headers"
# Medium'un görsel sunucusu kapağı diğer başlık görselleriyle aynı boyutta (1120x630) webp olarak kırpar
COVER_URL = "https://miro.medium.com/v2/resize:fill:1120:630/format:webp/{}"

MONTH_MAP = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []

    def handle_data(self, d):
        self.result.append(d)

    def get_text(self):
        return "".join(self.result)


def strip_html(html_text):
    s = HTMLStripper()
    s.feed(html_text)
    return s.get_text()


def extract_summary(entry, max_len=220):
    raw = entry.get("summary", "")
    text = strip_html(raw).strip()
    # Satır sonlarını temizle
    text = re.sub(r"\s+", " ", text)
    if len(text) > max_len:
        text = text[:max_len].rsplit(" ", 1)[0] + "..."
    return text


def extract_category(entry):
    tags = entry.get("tags", [])
    if tags:
        # İlk tag'i al, kısa ve uygun görünüyorsa kullan
        term = tags[0].get("term", "").strip()
        if term and len(term) < 30:
            return term.title()
    return "Management"


def format_dates(entry):
    t = entry.get("published_parsed")
    if t:
        dt = datetime(*t[:6])
    else:
        dt = datetime.utcnow()
    iso = dt.strftime("%Y-%m-%d")
    display = f"{MONTH_MAP[dt.month]} {dt.day}, {dt.year}"
    return iso, display


def extract_cover_id(entry):
    """Yazıdaki ilk Medium görselinin kimliğini döner (ör. 1*abc.png); görsel yoksa None."""
    content = entry.get("content") or [{}]
    html = content[0].get("value", "") or entry.get("summary", "")
    for src in re.findall(r'<img[^>]+src="([^"]+)"', html):
        # Sondaki 1x1 istatistik pikseli (medium.com/_/stat) görsel değil
        if "cdn-images-1.medium.com" in src or "miro.medium.com" in src:
            return src.rstrip("/").split("/")[-1]
    return None


def download_cover(entry, post_url):
    """Kapak görselini indirip blog.html'deki yolunu döner; indirilemezse uyarı basar ve Medium logosunu kullanır."""
    image_id = extract_cover_id(entry)
    if not image_id:
        return MEDIUM_LOGO
    post_id = post_url.split("?")[0].rstrip("/").split("-")[-1]
    file_name = f"medium-{post_id}.webp"
    req = urllib.request.Request(COVER_URL.format(image_id), headers={"User-Agent": "berkayvuran.com medium-sync"})
    # "::warning::" satırları GitHub Actions çalışmasının özetinde uyarı olarak görünür
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content_type = resp.headers.get_content_type()
            data = resp.read()
    except OSError as err:
        print(f"::warning::Kapak indirilemedi, Medium logosu kullanıldı: {post_url} ({err})")
        return MEDIUM_LOGO
    if content_type != "image/webp":
        print(f"::warning::Kapak webp değil ({content_type}), Medium logosu kullanıldı: {post_url}")
        return MEDIUM_LOGO
    with open(f"{COVER_DIR}/{file_name}", "wb") as f:
        f.write(data)
    return f"../{COVER_DIR}/{file_name}"


def build_html_block(entry):
    url = entry.get("link", "").strip()
    title = entry.get("title", "").strip()
    category = extract_category(entry)
    summary = extract_summary(entry)
    iso_date, display_date = format_dates(entry)
    cover = download_cover(entry, url)

    # Başlıktaki tek tırnakları escape et
    safe_title = title.replace("'", "&#39;")

    return f"""
            <li class="blog-post-item">
              <a href="{url}"
                target="_blank" rel="noopener noreferrer">

                <figure class="blog-banner-box">
                  <img loading="eager" decoding="async" src="{cover}" fetchpriority="high" width="800" height="400"
                    alt="'{safe_title}'">
                </figure>

                <div class="blog-content">

                  <div class="blog-meta">
                    <p class="blog-category">{category}</p>

                    <span class="dot"></span>

                    <time datetime="{iso_date}">{display_date}</time>
                  </div>

                  <h3 class="h3 blog-item-title">{title}</h3>

                  <p class="blog-text">
                    {summary}
                  </p>

                </div>

              </a>

            </li>
"""


def main():
    # Blog HTML oku
    with open(BLOG_HTML, "r", encoding="utf-8") as f:
        content = f.read()

    # Mevcut URL'leri topla (duplicate kontrolü)
    existing_urls = set(re.findall(r'href="(https?://[^"]+)"', content))

    # RSS feed çek
    feed = feedparser.parse(MEDIUM_RSS)
    if not feed.entries:
        print("RSS feed boş veya erişilemiyor.")
        sys.exit(1)

    new_blocks = []
    for entry in feed.entries:
        url = entry.get("link", "").strip()
        # RSS feed'in eklediği ?source=rss-... query string'ini temizle
        url = url.split("?")[0]
        if not url:
            continue
        # URL zaten var mı? (psyduct custom domain de olabilir, medium URL'yi karşılaştır)
        if url in existing_urls:
            continue
        # medium.com URL'nin psyduct versiyonu da var mı?
        slug = url.split("/")[-1]
        if any(slug in u for u in existing_urls):
            continue
        new_blocks.append(build_html_block(entry))
        print(f"  + Eklenecek: {entry.get('title', '')}")

    if not new_blocks:
        print("Yeni makale yok, hiçbir şey değiştirilmedi.")
        sys.exit(0)

    # Yeni blokları listenin başına ekle
    insert_pos = content.find(INSERT_AFTER)
    if insert_pos == -1:
        print(f"HATA: '{INSERT_AFTER}' bulunamadı.")
        sys.exit(1)

    insert_pos += len(INSERT_AFTER)
    new_content = (
        content[:insert_pos]
        + "".join(new_blocks)
        + content[insert_pos:]
    )

    with open(BLOG_HTML, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"{len(new_blocks)} yeni makale eklendi.")


if __name__ == "__main__":
    main()
