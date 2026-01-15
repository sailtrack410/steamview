/**
 * @author Lywq
 * @description 轻量级 Toast 组件
 */

const LywqToastConfig = {
    prefix: 'lywq-',
    icons: {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✓',
        fail: '✗',
        loading: `<div class="lywq-loading-icon">↻</div>`
    }
};

// 创建样式元素
const toastStyle = document.createElement('style');
toastStyle.textContent = `
.${LywqToastConfig.prefix}toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.${LywqToastConfig.prefix}toast {
    min-width: 250px;
    max-width: 350px;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    animation: ${LywqToastConfig.prefix}fadeIn 0.3s ease-out;
    transition: all 0.3s ease;
    background-color: #fff;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}fade-out {
    animation: ${LywqToastConfig.prefix}fadeOut 0.3s ease-out;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}info {
    border-left: 4px solid #1890ff;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}warning {
    border-left: 4px solid #faad14;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}success {
    border-left: 4px solid #52c41a;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}fail {
    border-left: 4px solid #ff4d4f;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}loading {
    border-left: 4px solid #722ed1;
}

.${LywqToastConfig.prefix}toast-icon {
    margin-right: 12px;
    font-size: 20px;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}info .${LywqToastConfig.prefix}toast-icon {
    color: #1890ff;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}warning .${LywqToastConfig.prefix}toast-icon {
    color: #faad14;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}success .${LywqToastConfig.prefix}toast-icon {
    color: #52c41a;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}fail .${LywqToastConfig.prefix}toast-icon {
    color: #ff4d4f;
}

.${LywqToastConfig.prefix}toast.${LywqToastConfig.prefix}loading .${LywqToastConfig.prefix}toast-icon {
    color: #722ed1;
}

.${LywqToastConfig.prefix}loading-icon {
    animation: ${LywqToastConfig.prefix}spin 1s linear infinite;
}

.${LywqToastConfig.prefix}toast-close {
    margin-left: auto;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    font-size: 18px;
    color: #666;
}

.${LywqToastConfig.prefix}toast-close:hover {
    opacity: 1;
}

@keyframes ${LywqToastConfig.prefix}fadeIn {
    from {
        opacity: 0;
        transform: translateX(30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes ${LywqToastConfig.prefix}fadeOut {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(30px);
    }
}

@keyframes ${LywqToastConfig.prefix}spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
`;
document.head.appendChild(toastStyle);

// 创建 LywqToast 命名空间
const LywqToast = (function () {
    // 创建容器
    let container = document.querySelector(`.${LywqToastConfig.prefix}toast-container`);
    if (!container) {
        container = document.createElement('div');
        container.className = `${LywqToastConfig.prefix}toast-container`;
        document.body.appendChild(container);
    }

    // 显示 Toast
    function show(type, message, duration = 3000) {
        // 创建 Toast 元素
        const toast = document.createElement('div');
        toast.className = `${LywqToastConfig.prefix}toast ${LywqToastConfig.prefix}${type}`;

        // 添加图标
        const icon = document.createElement('div');
        icon.className = `${LywqToastConfig.prefix}toast-icon`;
        icon.innerHTML = LywqToastConfig.icons[type];
        toast.appendChild(icon);

        // 添加消息
        const messageElement = document.createElement('div');
        messageElement.className = `${LywqToastConfig.prefix}toast-message`;
        messageElement.textContent = message;
        toast.appendChild(messageElement);

        // 添加关闭按钮
        const closeButton = document.createElement('button');
        closeButton.className = `${LywqToastConfig.prefix}toast-close`;
        closeButton.innerHTML = '×';
        closeButton.onclick = function () {
            closeToast(toast);
        };
        toast.appendChild(closeButton);

        // 添加到容器
        container.appendChild(toast);

        // 设置自动关闭
        if (duration > 0) {
            setTimeout(() => {
                closeToast(toast);
            }, duration);
        }

        return toast;
    }

    // 关闭 Toast
    function closeToast(toast) {
        if (!toast) return;
        toast.classList.add(`${LywqToastConfig.prefix}fade-out`);
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }

    // 关闭所有 Toast
    function closeAll() {
        const toasts = container.querySelectorAll(`.${LywqToastConfig.prefix}toast`);
        toasts.forEach(toast => {
            closeToast(toast);
        });
    }

    return {
        info: (message, duration) => show('info', message, duration),
        warning: (message, duration) => show('warning', message, duration),
        success: (message, duration) => show('success', message, duration),
        fail: (message, duration) => show('fail', message, duration),
        loading: (message, duration) => show('loading', message, duration),
        close: closeToast,
        closeAll: closeAll,
        config: LywqToastConfig
    };
})();

// 导出 LywqToast 对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LywqToast;
} else if (typeof define === 'function' && define.amd) {
    define([], function () {
        return LywqToast;
    });
}