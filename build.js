require('dotenv').config(); // 加载 .env 文件
const { build } = require('electron-builder');

build({
  config: {
    appId: process.env.GH_APP_ID,
    publish: [
      {
        provider: "github",
        owner: "Chunyu33",
        repo: "slacke-fish",
        token: process.env.GH_TOKEN,  // 从环境变量读取
      }
    ]
  }
}).catch(err => console.error(err));
