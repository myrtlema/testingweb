// 不需要 require('node-fetch')，Vercel Node.js 18+ 已內建 fetch

module.exports = async function handler(req, res) {
    // 1. 設定 CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 限制只接受 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // 4. 讀取環境變數 (請確認 Vercel 後台有設定 GAS_URL)
        const GAS_URL = process.env.GAS_URL;
        
        if (!GAS_URL) {
            console.error("Missing GAS_URL environment variable");
            return res.status(500).json({ error: "GAS_URL environment variable is not configured" });
        }

        // 5. 取得前端資料
        const bodyData = req.body;

        // 6. 轉送資料到 GAS (直接使用內建 fetch)
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
            redirect: 'follow'
        });

        // 7. 取得回覆內容
        const responseText = await response.text();
        
        // 嘗試解析 JSON，失敗則回傳原始文字
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { status: "success", raw: responseText };
        }

        return res.status(200).json(result);

    } catch (error) {
        // 8. 錯誤處理：這會在 Vercel Logs 中顯示詳細原因
        console.error('Runtime Error:', error.message);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
};