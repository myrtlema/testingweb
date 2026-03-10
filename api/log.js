// 使用 CommonJS 語法，相容於 Vercel Serverless Functions
const fetch = require('node-fetch'); // Vercel 運作環境已內建或自動處理

module.exports = async function handler(req, res) {
    // 1. 設定 CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 處理 OPTIONS 請求 (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 限制只接受 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // 4. 讀取環境變數
        const GAS_URL = process.env.GAS_URL;
        if (!GAS_URL) {
            return res.status(500).json({ error: "GAS_URL environment variable is not configured" });
        }

        // 5. 取得前端傳來的 JSON 資料 (req.body 已由 Vercel 解析)
        const data = req.body;

        // 6. 轉送資料到 Google Apps Script
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            redirect: 'follow' // 重要：處理 GAS 的 302 重導向
        });

        // 7. 處理 GAS 的回覆
        const responseText = await response.text();
        
        try {
            // 嘗試解析為 JSON
            const jsonResponse = JSON.parse(responseText);
            return res.status(200).json(jsonResponse);
        } catch (e) {
            // 若非 JSON 格式則回傳原始文字
            return res.status(200).json({ 
                status: "success", 
                raw: responseText 
            });
        }

    } catch (error) {
        // 8. 錯誤處理
        console.error('Serverless Function Error:', error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
};