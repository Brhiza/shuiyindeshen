document.addEventListener('DOMContentLoaded', () => {
    const imageLoader = document.getElementById('imageLoader');
    const dropZone = document.getElementById('drop-zone');
    const watermarkOptions = document.getElementById('watermark-options');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const customWatermarkInput = document.getElementById('customWatermark');
    const fullscreenCheckbox = document.getElementById('fullscreenWatermark');
    const customWatermarkUpload = document.getElementById('custom-watermark-upload');
    const watermarkLoader = document.getElementById('watermarkLoader');
    const noWatermarkOption = document.getElementById('no-watermark-option');
   const advancedModeCheckbox = document.getElementById('advancedMode');
   const advancedControls = document.getElementById('advanced-controls');
    const watermarkColorInput = document.getElementById('watermarkColor');
    const watermarkOpacityInput = document.getElementById('watermarkOpacity');
    const watermarkSizeInput = document.getElementById('watermarkSize');
    const watermarkSpacingInput = document.getElementById('watermarkSpacing');
    const shadowColorInput = document.getElementById('shadowColor');
    const shadowBlurInput = document.getElementById('shadowBlur');
    const shadowOffsetXInput = document.getElementById('shadowOffsetX');
    const shadowOffsetYInput = document.getElementById('shadowOffsetY');
   const applyColorContainer = document.getElementById('apply-color-container');
   const applyColorCheckbox = document.getElementById('applyColorCheckbox');
    const timeWatermarkCheckbox = document.getElementById('timeWatermark');

     let originalImage = null;
     let selectedWatermarkPath = null;
   let customLogo = null;
    let customWatermarkText = '';
    let isFullscreen = false;
    let isTimeWatermark = false;
   let watermarkColor = '#ffffff';
   let watermarkOpacity = 1;
   let watermarkSize = 1;
   let watermarkSpacing = 2;
   let shadowColor = '#000000';
   let shadowBlur = 10;
   let shadowOffsetX = 5;
   let shadowOffsetY = 5;
    const watermarkCache = {}; // 用于缓存水印图片

    // 水印logo文件名列表
    const watermarkLogos = [
        '豆包.png', '即梦.png', '剪映.png', '可灵.png',
        '通义.png', '星绘.png', '元宝.png', 'Gemini.png', 'Grok.png', 'OpenAI.png', 'Midjourney.png'
    ];

    // 预加载水印图片
    function preloadWatermarks() {
        watermarkLogos.forEach(logoName => {
            const img = new Image();
            img.src = logoName;
            watermarkCache[logoName] = img;
        });
    }
    preloadWatermarks(); // 页面加载时即开始预加载

    // 动态加载水印选项
    watermarkLogos.forEach(logoName => {
        const optionDiv = document.createElement('div');
        const displayName = logoName.replace('.png', '');
        optionDiv.textContent = displayName;
        optionDiv.dataset.value = logoName;
        optionDiv.classList.add('watermark-option');
        optionDiv.title = displayName;
        watermarkOptions.appendChild(optionDiv);

        if (logoName === '豆包.png') {
            optionDiv.classList.add('selected');
            selectedWatermarkPath = logoName;
        }

        optionDiv.addEventListener('click', () => {
            // 移除其他选项的选中状态
            document.querySelectorAll('.watermark-option').forEach(opt => opt.classList.remove('selected'));
            // 添加选中状态
            optionDiv.classList.add('selected');
            selectedWatermarkPath = optionDiv.dataset.value;
            customWatermarkInput.value = ''; // 清空自定义文本
            customWatermarkText = '';

            if (originalImage) {
                drawImageWithWatermark();
            }
        });
    });

    // 自定义水印输入处理
    customWatermarkInput.addEventListener('input', (e) => {
        customWatermarkText = e.target.value;
        // 当输入自定义文本时，取消图片水印的选择
        document.querySelectorAll('.watermark-option').forEach(opt => opt.classList.remove('selected'));
        selectedWatermarkPath = null;

        if (originalImage) {
            drawImageWithWatermark();
        }
    });

    // 勾选框状态变化处理
    fullscreenCheckbox.addEventListener('change', (e) => {
        isFullscreen = e.target.checked;
        // 只要有原图和任意一种水印，就重绘
        if (originalImage && (customWatermarkText || selectedWatermarkPath)) {
            drawImageWithWatermark();
        }
    });

   advancedModeCheckbox.addEventListener('change', (e) => {
       if (e.target.checked) {
           advancedControls.style.display = 'block';
       } else {
           advancedControls.style.display = 'none';
       }
       // 当勾选状态改变时，立即重绘
       if (originalImage && (customWatermarkText || selectedWatermarkPath)) {
           drawImageWithWatermark();
        }
        updateApplyColorVisibility();
   });

 
    timeWatermarkCheckbox.addEventListener('change', (e) => {
        isTimeWatermark = e.target.checked;
        if (originalImage) {
            drawImageWithWatermark();
        }
    });

     // --- 高级控制事件监听 ---
    function handleAdvancedControlsChange() {
        watermarkColor = watermarkColorInput.value;
        watermarkOpacity = parseFloat(watermarkOpacityInput.value);
        watermarkSize = parseFloat(watermarkSizeInput.value);
        watermarkSpacing = parseFloat(watermarkSpacingInput.value);
        shadowColor = shadowColorInput.value;
        shadowBlur = parseInt(shadowBlurInput.value, 10);
        shadowOffsetX = parseInt(shadowOffsetXInput.value, 10);
        shadowOffsetY = parseInt(shadowOffsetYInput.value, 10);

        if (originalImage && (customWatermarkText || selectedWatermarkPath)) {
            drawImageWithWatermark();
        }
    }

    watermarkColorInput.addEventListener('input', handleAdvancedControlsChange);
    watermarkOpacityInput.addEventListener('input', handleAdvancedControlsChange);
    watermarkSizeInput.addEventListener('input', handleAdvancedControlsChange);
    watermarkSpacingInput.addEventListener('input', handleAdvancedControlsChange);
    shadowColorInput.addEventListener('input', handleAdvancedControlsChange);
    shadowBlurInput.addEventListener('input', handleAdvancedControlsChange);
    shadowOffsetXInput.addEventListener('input', handleAdvancedControlsChange);
    shadowOffsetYInput.addEventListener('input', handleAdvancedControlsChange);
   applyColorCheckbox.addEventListener('change', handleAdvancedControlsChange);
 
     // --- 新增：自定义水印上传 ---
    customWatermarkUpload.addEventListener('click', () => {
        watermarkLoader.click();
    });

    watermarkLoader.addEventListener('change', (e) => {
        if (e.target.files && e.target.files) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    customLogo = img;
                    const customWatermarkName = `custom_${Date.now()}`;
                    watermarkCache[customWatermarkName] = img;

                    // 创建并选中新的水印选项
                    const optionDiv = document.createElement('div');
                    optionDiv.textContent = '自定义';
                    optionDiv.dataset.value = customWatermarkName;
                    optionDiv.classList.add('watermark-option', 'selected');
                    optionDiv.title = '自定义水印';
                    
                    // 插入到上传按钮之前
                    watermarkOptions.insertBefore(optionDiv, customWatermarkUpload);

                    // 移除其他选项的选中状态
                    document.querySelectorAll('.watermark-option:not([data-value="' + customWatermarkName + '"])').forEach(opt => opt.classList.remove('selected'));
                    
                    selectedWatermarkPath = customWatermarkName;
                    customWatermarkInput.value = '';
                    customWatermarkText = '';

                    if (originalImage) {
                        drawImageWithWatermark();
                   }
                   updateApplyColorVisibility();

                    // 为新选项添加点击事件
                    optionDiv.addEventListener('click', () => {
                        document.querySelectorAll('.watermark-option').forEach(opt => opt.classList.remove('selected'));
                        optionDiv.classList.add('selected');
                        selectedWatermarkPath = optionDiv.dataset.value;
                        customWatermarkInput.value = '';
                        customWatermarkText = '';
                        if (originalImage) {
                            drawImageWithWatermark();
                        }
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files);
        }
    });
    // --- 结束：自定义水印上传 ---

    // --- 新增：无水印选项 ---
    noWatermarkOption.addEventListener('click', () => {
        // 移除所有选项的选中状态
        document.querySelectorAll('.watermark-option').forEach(opt => opt.classList.remove('selected'));
        // 为无水印选项添加选中状态
        noWatermarkOption.classList.add('selected');

        // 清空图片水印相关的变量
        selectedWatermarkPath = null;

        // 如果有原图，则重绘
        if (originalImage) {
            drawImageWithWatermark();
        }
    });
    // --- 结束：无水印选项 ---

    // 图片上传处理
    // 点击上传区域
    dropZone.addEventListener('click', () => imageLoader.click());

    // 拖放事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    imageLoader.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                // 显示画布容器
                canvas.parentElement.style.display = 'flex';
                canvas.style.display = 'block'; // 确保canvas可见
                resultImage.style.display = 'none'; // 隐藏旧的结果图片

                if (selectedWatermarkPath || customWatermarkText) {
                    drawImageWithWatermark();
                } else {
                    // 如果还没有选择水印，只绘制原图并显示为图片
                    // --- 计算画布的显示尺寸 (逻辑同 drawImageWithWatermark) ---
                    const container = canvas.parentElement;
                    const computedStyle = getComputedStyle(container);
                    const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
                    const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
                    const maxWidth = container.clientWidth - paddingX;
                    const maxHeight = (window.innerHeight * 0.7) - paddingY;
                    const widthRatio = maxWidth / originalImage.width;
                    const heightRatio = maxHeight / originalImage.height;
                    const scale = Math.min(widthRatio, heightRatio, 1);
                    const displayWidth = originalImage.width * scale;
                    const displayHeight = originalImage.height * scale;
                    canvas.style.width = `${displayWidth}px`;
                    canvas.style.height = `${displayHeight}px`;
                    // --- 结束计算 ---

                    canvas.width = originalImage.width;
                    canvas.height = originalImage.height;
                    ctx.drawImage(originalImage, 0, 0);

                    // --- 显示结果图片 ---
                    const imageUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resultImage.src = imageUrl;
                    resultImage.style.display = 'block';
                    resultImage.style.width = canvas.style.width;
                    resultImage.style.height = canvas.style.height;
                    canvas.style.display = 'none'; // 隐藏canvas
                }
            };
            originalImage.src = event.target.result;
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    }

   function updateApplyColorVisibility() {
       const isAdvanced = advancedModeCheckbox.checked;
       const isCustomLogoUploaded = !!customLogo;
       if (isAdvanced && isCustomLogoUploaded) {
           applyColorContainer.style.display = 'flex';
           applyColorCheckbox.checked = false; // 默认不勾选
       } else {
           applyColorContainer.style.display = 'none';
       }
   }

    function drawImageWithWatermark() {
        // 设置画布尺寸与原图一致
        // --- 新增：计算画布的显示尺寸 ---
        const container = canvas.parentElement;
        const computedStyle = getComputedStyle(container);
        const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
        const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

        // 使用clientWidth减去水平内边距获得最大宽度
        const maxWidth = container.clientWidth - paddingX;
        // 使用CSS中定义的70vh作为最大高度，并减去垂直内边距
        const maxHeight = (window.innerHeight * 0.7) - paddingY;

        const widthRatio = maxWidth / originalImage.width;
        const heightRatio = maxHeight / originalImage.height;
        // 取较小的缩放比例，确保完全容纳，并且不放大图片
        const scale = Math.min(widthRatio, heightRatio, 1);

        const displayWidth = originalImage.width * scale;
        const displayHeight = originalImage.height * scale;

        // 设置画布的CSS显示尺寸
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        // --- 结束：计算画布的显示尺寸 ---

        // 设置画布的绘图缓冲尺寸，保持原图分辨率
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        // 1. 绘制原图
        ctx.drawImage(originalImage, 0, 0);

        // 如果没有选择水印或输入文字，且没有启用时间水印，则直接返回，不进行后续绘制
        if (!selectedWatermarkPath && !customWatermarkText && !isTimeWatermark) {
            // 隐藏下载按钮
            downloadBtn.style.display = 'none';
            // --- 新增：显示结果图片 ---
            const imageUrl = canvas.toDataURL('image/jpeg', 0.7);
            resultImage.src = imageUrl;
            resultImage.style.display = 'block';
            resultImage.style.width = canvas.style.width;
            resultImage.style.height = canvas.style.height;
            canvas.style.display = 'none'; // 隐藏canvas
            return;
        }

        // 2. 绘制水印
        const baseDimension = Math.min(originalImage.width, originalImage.height);
        const margin = baseDimension * 0.03;

        // --- 新增：根据高级模式状态决定配置 ---
        const isAdvanced = advancedModeCheckbox.checked;
        const settings = {
            color: isAdvanced ? watermarkColor : '#ffffff',
            opacity: isAdvanced ? watermarkOpacity : 1,
            size: isAdvanced ? watermarkSize : 1,
            spacing: isAdvanced ? watermarkSpacing : 2,
            shadowColor: isAdvanced ? shadowColor : 'rgba(0, 0, 0, 0.5)',
            shadowBlur: isAdvanced ? shadowBlur : 10,
            shadowOffsetX: isAdvanced ? shadowOffsetX : 5,
            shadowOffsetY: isAdvanced ? shadowOffsetY : 5,
        };
        // --- 结束：配置决定 ---

        // 添加阴影
        ctx.shadowColor = settings.shadowColor;
        ctx.shadowBlur = settings.shadowBlur;
        ctx.shadowOffsetX = settings.shadowOffsetX;
        ctx.shadowOffsetY = settings.shadowOffsetY;

        if (selectedWatermarkPath) {
            const watermarkImage = watermarkCache[selectedWatermarkPath];
            if (!watermarkImage || !watermarkImage.complete) {
                setTimeout(drawImageWithWatermark, 50);
                return;
            }

            // --- 新逻辑：使用离屏Canvas为图片水印上色 ---
            function createColoredWatermark(image, color) {
                const offscreenCanvas = document.createElement('canvas');
                const offscreenCtx = offscreenCanvas.getContext('2d');

                offscreenCanvas.width = image.width;
                offscreenCanvas.height = image.height;

                // 1. 绘制原始图片
                offscreenCtx.drawImage(image, 0, 0);

                // 2. 使用 'source-in' 模式填充颜色
                offscreenCtx.globalCompositeOperation = 'source-in';
                offscreenCtx.fillStyle = color;
                offscreenCtx.fillRect(0, 0, image.width, image.height);

                return offscreenCanvas;
            }

            const isCustomWatermark = selectedWatermarkPath.startsWith('custom_');
           const applyColor = applyColorCheckbox.checked;
           const coloredWatermark = isAdvanced && applyColor
                ? createColoredWatermark(watermarkImage, settings.color)
                : watermarkImage;
            // --- 结束：离屏Canvas逻辑 ---

            const scale = baseDimension / 4000;
            let watermarkWidth = coloredWatermark.width * scale * settings.size;
            let watermarkHeight = coloredWatermark.height * scale * settings.size;

            const maxWatermarkWidth = originalImage.width * 0.3;
            if (watermarkWidth > maxWatermarkWidth) {
                watermarkWidth = maxWatermarkWidth;
                watermarkHeight = watermarkWidth * (coloredWatermark.width / coloredWatermark.height);
            }
            
            ctx.globalAlpha = settings.opacity; // 在绘制时应用透明度

            if (isFullscreen) {
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-0.25 * Math.PI);

                const gap = watermarkWidth * settings.spacing;

                const startX = -canvas.width * 1.5;
                const endX = canvas.width * 1.5;
                const startY = -canvas.height * 1.5;
                const endY = canvas.height * 1.5;

                for (let x = startX; x < endX; x += gap) {
                    for (let y = startY; y < endY; y += gap * 1.2) {
                        ctx.drawImage(coloredWatermark, x - watermarkWidth / 2, y - watermarkHeight / 2, watermarkWidth, watermarkHeight);
                    }
                }
                
                ctx.restore();
            } else {
                const x = canvas.width - watermarkWidth - margin;
                const y = canvas.height - watermarkHeight - margin;
                ctx.drawImage(coloredWatermark, x, y, watermarkWidth, watermarkHeight);
            }
            
            ctx.globalAlpha = 1.0; // 重置透明度

        } else if (customWatermarkText) {
           function hexToRgba(hex, alpha) {
               const r = parseInt(hex.slice(1, 3), 16);
               const g = parseInt(hex.slice(3, 5), 16);
               const b = parseInt(hex.slice(5, 7), 16);
               return `rgba(${r}, ${g}, ${b}, ${alpha})`;
           }

            const fontSize = baseDimension * 0.05 * settings.size;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = hexToRgba(settings.color, settings.opacity);

            if (isFullscreen) {
                // --- 新增：铺满全屏逻辑 ---
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 保存当前状态并旋转画布
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-0.25 * Math.PI); // 旋转约-45度
                
                const textWidth = ctx.measureText(customWatermarkText).width;
                const gap = textWidth * settings.spacing; // 水印之间的间隙

                // 计算平铺的起始和结束点
                const startX = -canvas.width * 1.5;
                const endX = canvas.width * 1.5;
                const startY = -canvas.height * 1.5;
                const endY = canvas.height * 1.5;

                for (let x = startX; x < endX; x += gap) {
                    for (let y = startY; y < endY; y += gap * 1.2) {
                        ctx.fillText(customWatermarkText, x, y);
                    }
                }
                
                ctx.restore(); // 恢复画布状态
                // --- 结束：铺满全屏逻辑 ---
            } else {
                // 绘制单个右下角水印
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                const x = canvas.width - margin;
                const y = canvas.height - margin;
                ctx.fillText(customWatermarkText, x, y);
            }
        }


        if (isTimeWatermark) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayOfWeek = week[now.getDay()];
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const timeText = `${year}.${month}.${day} ${dayOfWeek} ${hours}:${minutes}`;

            const fontSize = baseDimension * 0.04 * settings.size; // 应用高级模式的大小
            ctx.font = `bold ${fontSize}px Arial`;
            
            // 使用 hexToRgba 函数应用颜色和透明度
            function hexToRgba(hex, alpha) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            ctx.fillStyle = hexToRgba(settings.color, settings.opacity);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom'; // 改为底部对齐
            
            // 阴影已在前面统一设置，这里直接绘制即可
            // Y坐标改为画布高度减去边距，以确保在左下角
            ctx.fillText(timeText, margin, canvas.height - margin);
        }

        // 重置阴影，以免影响其他绘图
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 只要有水印（图片或文字或时间水印），就显示按钮
        if (selectedWatermarkPath || customWatermarkText || isTimeWatermark) {
            downloadBtn.style.display = 'block';
        } else {
            downloadBtn.style.display = 'none';
        }

        // --- 新增：显示结果图片 ---
        const imageUrl = canvas.toDataURL('image/jpeg', 0.7);
        resultImage.src = imageUrl;
        resultImage.style.display = 'block';
        resultImage.style.width = canvas.style.width;
        resultImage.style.height = canvas.style.height;
        canvas.style.display = 'none'; // 隐藏canvas
    }

    // --- 平台优化的保存功能 ---
    downloadBtn.textContent = '保存图片';


    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    downloadBtn.addEventListener('click', () => {
        if (!originalImage) {
            alert('请先上传一张图片。');
            return;
        }
        if (!selectedWatermarkPath && !customWatermarkText && !isTimeWatermark) {
            alert('请选择或输入一个水印，或启用时间水印。');
            return;
        }

        const imageUrl = canvas.toDataURL('image/jpeg', 0.7);

        if (isIOS()) {
            // iOS设备：在新标签页打开，方便长按保存
            const newTab = window.open();
            newTab.document.write(`<img src="${imageUrl}" style="max-width: 100%;">`);
        } else {
            // 桌面或其他设备：直接下载
            const link = document.createElement('a');
            link.download = 'watermarked-image.jpg';
            link.href = imageUrl;
            link.click();
        }
    });

   function updateTime() {
       const timeElement = document.getElementById('time-watermark');
       if (timeElement) {
           const now = new Date();
           const year = now.getFullYear();
           const month = now.getMonth() + 1;
           const day = now.getDate();
           const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
           const dayOfWeek = week[now.getDay()];
           const hours = now.getHours();
           const minutes = now.getMinutes().toString().padStart(2, '0');
           timeElement.textContent = `${year}.${month}.${day} ${dayOfWeek} ${hours}:${minutes}`;
       }
   }

   updateTime();
   setInterval(updateTime, 60000);
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}