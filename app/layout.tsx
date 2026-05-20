import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "粤瓷 - 粤语歌词粤拼转换器",
  description: "输入歌曲名，自动标注标准粤语发音，导出带粤拼的 LRC 文件",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
