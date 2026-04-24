/**
 * 图标生成脚本
 * 将 SVG 转换为 ICO 和 PNG 格式
 * 
 * 使用方法: node src/scripts/generateIcons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// png-to-ico 是 ESM 模块，需要动态导入
let pngToIco;

const ASSETS_DIR = path.join(__dirname, '../assets');
const SVG_INPUT = path.join(ASSETS_DIR, 'icon.svg');
const PNG_OUTPUT = path.join(ASSETS_DIR, 'app.png');
const ICO_OUTPUT = path.join(ASSETS_DIR, 'app.ico');

// ICO 需要的多种尺寸
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function generateIcons() {
  console.log('🎨 开始生成图标...\n');

  // 动态导入 ESM 模块
  const pngToIcoModule = await import('png-to-ico');
  pngToIco = pngToIcoModule.default;

  // 检查 SVG 文件是否存在
  if (!fs.existsSync(SVG_INPUT)) {
    console.error(`❌ 错误: 找不到 SVG 文件: ${SVG_INPUT}`);
    process.exit(1);
  }

  try {
    // 1. 生成 PNG (256x256 作为主图标)
    console.log('📦 生成 PNG 图标...');
    await sharp(SVG_INPUT)
      .resize(256, 256)
      .png()
      .toFile(PNG_OUTPUT);
    console.log(`   ✅ ${PNG_OUTPUT}`);

    // 2. 生成多尺寸 PNG 用于 ICO
    console.log('\n📦 生成多尺寸 PNG 用于 ICO...');
    const pngBuffers = [];
    
    for (const size of ICO_SIZES) {
      const buffer = await sharp(SVG_INPUT)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(buffer);
      console.log(`   ✅ ${size}x${size}`);
    }

    // 3. 将多尺寸 PNG 合并为 ICO
    console.log('\n📦 生成 ICO 图标...');
    const icoBuffer = await pngToIco(pngBuffers);
    fs.writeFileSync(ICO_OUTPUT, icoBuffer);
    console.log(`   ✅ ${ICO_OUTPUT}`);

    console.log('\n🎉 图标生成完成!');
    console.log(`   - PNG: ${PNG_OUTPUT}`);
    console.log(`   - ICO: ${ICO_OUTPUT}`);

  } catch (error) {
    console.error('❌ 生成图标时出错:', error.message);
    process.exit(1);
  }
}

generateIcons();
