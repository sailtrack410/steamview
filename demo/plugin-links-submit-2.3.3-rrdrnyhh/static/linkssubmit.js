window.LinksSubmit = {
    submit: function (data, verifyCode = '', verifyCodeType = '') {
        if (!data.submitType) {
            data.submitType = 'CREATE';
        }
        return fetch(`/apis/linkssubmit.muyin.site/v1alpha1/submit?verifyCode=${verifyCode}&verifyCodeType=${verifyCodeType}`, {
            method: 'POST', headers: {
                'Authorization': window.__LINKS_SUBMIT_GLOBAL_CONFIG.authToken,
                'Content-Type': 'application/json'
            }, body: JSON.stringify(data)
        }).then(this._handleResponse);
    },
    getLinkGroups: function () {
        return fetch('/apis/linkssubmit.muyin.site/v1alpha1/linkGroups', {
            method: 'GET', headers: {
                'Authorization': window.__LINKS_SUBMIT_GLOBAL_CONFIG.authToken
            }
        }).then(this._handleResponse);
    },
    sendVerifyCode: function (email) {
        return fetch(`/apis/linkssubmit.muyin.site/v1alpha1/sendVerifyCode`, {
            method: 'POST', headers: {
                'Authorization': window.__LINKS_SUBMIT_GLOBAL_CONFIG.authToken,
                'Content-Type': 'application/json'
            }, body: JSON.stringify({ email: email })
        }).then(this._handleResponse);
    },
    getLinkDetail: function (url) {
        return fetch(`/apis/linkssubmit.muyin.site/v1alpha1/linkDetail?url=${url}`, {
            method: 'GET', headers: {
                'Authorization': window.__LINKS_SUBMIT_GLOBAL_CONFIG.authToken
            }
        }).then(this._handleResponse);
    },
    getCaptchaUrl: function () {
        return '/apis/linkssubmit.muyin.site/v1alpha1/captcha?' + Math.random();
    },
    refreshCaptcha: function (element) {
        let img = typeof element === 'string' ? document.getElementById(element) : element;
        if (img && img.tagName === 'IMG') {
            img.src = this.getCaptchaUrl();
        } else {
            console.warn('LinksSubmit.refreshCaptcha: Invalid element or ID');
        }
    },
    /**
     * 修改友链
     * @param {Object} data - 友链数据，需包含 oldUrl 字段
     * @param {string} verifyCode - 验证码
     * @param {string} verifyCodeType - 验证码类型
     * @returns {Promise}
     */
    update: function (data, verifyCode = '', verifyCodeType = '') {
        data.submitType = 'UPDATE';
        return fetch(`/apis/linkssubmit.muyin.site/v1alpha1/submit?verifyCode=${verifyCode}&verifyCodeType=${verifyCodeType}`, {
            method: 'POST', headers: {
                'Authorization': window.__LINKS_SUBMIT_GLOBAL_CONFIG.authToken,
                'Content-Type': 'application/json'
            }, body: JSON.stringify(data)
        }).then(this._handleResponse);
    },
    _handleResponse: function (response) {
        if (!response.ok) {
            if (response.status === 429) {
                return Promise.reject({ msg: '操作频率过快，请稍后再试！', status: 429 });
            } else {
                return response.json().then(errorData => {
                    throw errorData;
                });
            }
        }
        return response.json();
    }
};

function resetForm() {
    document.getElementById('linksSubmit-form').reset();
}

function linksSubmitAction(redirectPage) {
    let displayName = document.getElementById('displayName').value;
    let url = document.getElementById('url').value;
    let logo = document.getElementById('logo').value;
    let email = document.getElementById('email').value;
    let description = document.getElementById('description').value;
    let linkPageUrl = document.getElementById('linkPageUrl').value;
    let groupName = document.getElementById('groupName').value;
    let rssUrl = document.getElementById('rssUrl').value;
    let verifyCode = document.getElementById('verifyCode').value;

    url = removeSpacesFromUrl(url);
    logo = removeSpacesFromUrl(logo);
    linkPageUrl = removeSpacesFromUrl(linkPageUrl);
    rssUrl = removeSpacesFromUrl(rssUrl);

    if (!displayName) {
        LywqToast.warning('请填写网站名称！', 2000);
        return;
    }
    if (!url) {
        LywqToast.warning('请填写网站地址！', 2000);
        return;
    }
    if (!email) {
        LywqToast.warning('请填写联系邮箱！', 2000);
        return;
    }
    if (!verifyCode) {
        LywqToast.warning('请填写验证码！', 2000);
        return;
    }
    if (!validateUrl(url)) {
        LywqToast.warning('请填写正确的网站地址！', 2000);
        return;
    }
    if (!validateEmail(email)) {
        LywqToast.warning('请填写正确的邮箱地址！', 2000);
        return;
    }
    if (logo && !validateUrl(logo)) {
        LywqToast.warning('请填写正确的网站图标！', 2000);
        return;
    }
    if (linkPageUrl && !validateUrl(linkPageUrl)) {
        LywqToast.warning('请填写正确的友链页面！', 2000);
        return;
    }
    if (rssUrl && !validateUrl(rssUrl)) {
        LywqToast.warning('请填写正确的RSS地址！', 2000);
        return;
    }

    // 获取提交类型
    let submitTypeElement = document.getElementById('submitType');
    let submitType = submitTypeElement ? submitTypeElement.value : 'CREATE';
    let oldUrl = '';

    // 如果是修改模式，需要校验原网站地址
    if (submitType === 'UPDATE') {
        let oldUrlElement = document.getElementById('oldUrl');
        oldUrl = oldUrlElement ? removeSpacesFromUrl(oldUrlElement.value) : '';
        if (!oldUrl) {
            LywqToast.warning('修改模式下请填写原网站地址！', 2000);
            return;
        }
        if (!validateUrl(oldUrl)) {
            LywqToast.warning('请填写正确的原网站地址！', 2000);
            return;
        }
    }

    // 处理url，最后一位是'/'时，直接移除'/'
    url = url.endsWith('/') ? url.slice(0, -1) : url;
    oldUrl = oldUrl.endsWith('/') ? oldUrl.slice(0, -1) : oldUrl;
    linkPageUrl = linkPageUrl.endsWith('/') ? linkPageUrl.slice(0, -1) : linkPageUrl;
    rssUrl = rssUrl.endsWith('/') ? rssUrl.slice(0, -1) : rssUrl;

    let jsonData = {
        displayName: displayName,
        url: url,
        logo: logo,
        email: email,
        description: description,
        linkPageUrl: linkPageUrl,
        groupName: groupName,
        rssUrl: rssUrl,
        submitType: submitType,
        oldUrl: oldUrl
    };

    requestLinksSubmit(JSON.stringify(jsonData), redirectPage, verifyCode);
}

/**
 * 切换提交类型（新增/修改）
 */
function switchSubmitType(type) {
    let submitTypeElement = document.getElementById('submitType');
    let oldUrlContainer = document.getElementById('oldUrlContainer');
    let oldUrlInput = document.getElementById('oldUrl');
    let buttons = document.querySelectorAll('.linksSubmit-submitType-btn');

    // 更新隐藏字段值
    if (submitTypeElement) {
        submitTypeElement.value = type;
    }

    // 更新按钮状态
    buttons.forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 切换原网站地址输入框显示/隐藏
    if (oldUrlContainer) {
        if (type === 'UPDATE') {
            oldUrlContainer.style.display = 'block';
            if (oldUrlInput) {
                oldUrlInput.required = true;
            }
        } else {
            oldUrlContainer.style.display = 'none';
            if (oldUrlInput) {
                oldUrlInput.required = false;
                oldUrlInput.value = '';
            }
        }
    }
}

// 校验url合法性
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// 校验邮箱合法性
function validateEmail(email) {
    let emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
    return emailRegex.test(email);
}

function requestLinksSubmit(jsonData, redirectPage, verifyCode) {
    let submitLoading = LywqToast.loading('提交中，请稍后...', 0);

    let data = jsonData;
    if (typeof jsonData === 'string') {
        try {
            data = JSON.parse(jsonData);
        } catch (e) {
            console.error("Invalid JSON data", e);
            LywqToast.closeAll();
            LywqToast.fail('数据格式错误', 2000);
            return;
        }
    }

    LinksSubmit.submit(data, verifyCode)
        .then(data => {
            LywqToast.closeAll();
            LywqToast.success(data.msg, 2000);
            if (data.code === 200) {
                resetForm();
                setTimeout(function () {
                    window.location.href = redirectPage;
                }, 2000);
            }
        })
        .catch(error => {
            LywqToast.closeAll();
            if (error.msg) {
                LywqToast.fail(error.msg, error.status === 429 ? 5000 : 3000);
            } else {
                LywqToast.fail('网络错误，请稍后再试！', 2000);
            }
        });
}

function removeSpacesFromUrl(url) {
    if (url === '') {
        return '';
    }
    // 去除字符串两端的空格
    url = url.trim();
    // 使用正则表达式替换字符串中的所有空格
    url = url.replace(/\s+/g, '');
    return url;
}

function renderLinkGroup() {
    let element = document.getElementById('groupName');
    if (!element) {
        return;
    }
    LinksSubmit.getLinkGroups()
        .then(data => {
            let optionList = data;
            let option = '<option value="" disabled>请选择友链分组</option>';
            optionList.forEach(function (item) {
                if (item.selected === true) {
                    option += '<option value="' + item.groupId + '" selected>' + item.groupName + '</option>';
                } else {
                    option += '<option value="' + item.groupId + '">' + item.groupName + '</option>';
                }
            });
            element.innerHTML = option;

        })
        .catch(error => {
            if (error.msg) {
                LywqToast.fail(error.msg, 3000);
            } else {
                LywqToast.fail('网络错误，请稍后再试！', 2000);
            }
        });
}

// 页面加载完成后渲染分组
document.addEventListener('DOMContentLoaded', function () {
    renderLinkGroup();
});

function sendVerifyCode(e) {
    let email = document.getElementById('email').value;
    if (!email) {
        LywqToast.warning('请填写邮箱！', 2000);
        return;
    } else {
        let btnText = e.innerText;
        e.disabled = true;
        e.innerText = '发送中...';
        LinksSubmit.sendVerifyCode(email)
            .then(data => {
                if (data.code === 200) {
                    let countdown = 60;
                    e.textContent = `${countdown}s`;
                    const interval = setInterval(() => {
                        countdown--;
                        e.textContent = `${countdown}s`;

                        if (countdown <= 0) {
                            clearInterval(interval);
                            e.disabled = false;
                            e.textContent = btnText;
                        }
                    }, 1000);
                } else {
                    e.disabled = false;
                    e.textContent = btnText;
                }
                // 处理后端返回的数据
                LywqToast.success(data.msg, 2000);
            })
            .catch(error => {
                e.disabled = false;
                e.textContent = btnText;
                if (error.msg) {
                    LywqToast.fail(error.msg, error.status === 429 ? 5000 : 3000);
                } else {
                    LywqToast.fail('网络错误，请稍后再试！', 2000);
                }
            });
    }
}

function refreshVerifyCode() {
    let img = document.getElementById('verifyCodeImg');
    img.src = LinksSubmit.getCaptchaUrl();
}

function copyBlogInfo(e) {
    // 复制博客信息
    var text = e.parentNode.parentNode.querySelector('.linksSubmit-card-content').textContent;
    navigator.clipboard.writeText(text).then(function () {
        LywqToast.success("复制博客信息成功", 2000);
    }).catch(function (err) {
        console.error('Could not copy text: ', err);
    });
}


function openLinksSubmitOverlay() {
    document.getElementById('linksSubmit-overlay').style.display = 'flex';
}

function closeLinksSubmitOverlay() {
    let element = document.getElementById('linksSubmit-overlay');
    if (element) {
        element.style.display = 'none';
    }
}

function getLinkDetail() {
    let url = document.getElementById('url').value;
    if (!url) {
        LywqToast.warning('请填写网站地址！', 2000);
        return;
    }
    let getLoading = LywqToast.loading("获取中...", 0);
    // 处理链接提交请求
    LinksSubmit.getLinkDetail(url)
        .then(data => {
            LywqToast.closeAll();
            if (data.code === 200) {
                const linkDetail = data.data;
                const title = linkDetail.title;
                const description = linkDetail.description;
                const icon = linkDetail.icon;
                const image = linkDetail.image;

                if (title) {
                    document.getElementById('displayName').value = title;
                }
                if (description) {
                    document.getElementById('description').value = description;
                }
                if (image) {
                    document.getElementById('logo').value = image;
                } else if (icon) {
                    document.getElementById('logo').value = icon;
                }

            }
            LywqToast.success(data.msg, 2000);
        })
        .catch(error => {
            LywqToast.closeAll();
            if (error.msg) {
                LywqToast.fail(error.msg, error.status === 429 ? 5000 : 3000);
            } else {
                LywqToast.fail('网络错误，请稍后再试！', 2000);
            }
        });
}

/**
 * 动态加载 lywq-toast.js 文件
 * 如果已经加载过则不再重复加载
 */
function loadToastPlugin() {
    // 检查是否已经存在 Toast 对象
    if (typeof LywqToast !== 'undefined') {
        console.debug('LywqToast 插件已加载，无需重复加载');
        return Promise.resolve(LywqToast);
    }

    // 检查是否已经有正在加载的 script
    const existingScript = document.querySelector('script[src*="lywq-toast.js"]');
    if (existingScript) {
        return new Promise((resolve) => {
            existingScript.onload = function () {
                resolve(LywqToast);
            };
        });
    }

    // 创建 script 标签动态加载
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/plugins/LinksSubmit/assets/static/lywq-toast.js';
        script.onload = function () {
            if (typeof LywqToast !== 'undefined') {
                console.debug('LywqToast 插件加载成功');
                resolve(LywqToast);
            } else {
                reject(new Error('LywqToast 插件加载失败'));
            }
        };
        script.onerror = function () {
            reject(new Error('加载 lywq-toast.js 失败'));
        };
        document.head.appendChild(script);
    });
}

// 加载 LywqToast 插件
loadToastPlugin();