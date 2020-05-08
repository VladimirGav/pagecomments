var Token = '';
var Nickname = '';
var Url = window.location.href;
var LoadComments = false;

if (chrome.tabs) {
    // get current url
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
        function (tabs) {
            showTab(tabs[0].url);
        });
} else {
    showTab(Url);
}

function showTab(tab) {
    Url = tab;

    function showMessage(messageHTML) {
        //document.getElementById("chat-box").append(messageHTML);
        document.getElementById("chat-box").insertAdjacentHTML("beforeend", messageHTML);
        document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
    }

    function showData(messageData) {
        document.getElementById("vg-page-comments").insertAdjacentHTML("beforeend", messageData);
    }


    let websocket = new WebSocket("ws://comments.reportax.ru:9445/templates/modules/pagecomments/websocket/php-socket.php");
    websocket.onopen = function (event) {
        showMessage("<div class='chat-connection-ack'>Connection is established!</div>");
        getCurrent();
    };

    websocket.onmessage = function (event) {
        var Data = JSON.parse(event.data);
        if (Data.error == '0') {
            if (Data.type == 'showData') {
                var DataAndwerArr = Data.info;
                console.log(DataAndwerArr.data);
                showData(DataAndwerArr.data);
            }
            if (Data.type == 'showCurrent') {
                var DataAndwerArr = Data.info;
                updateAuth();
            }
            if (Data.type == 'showUsers') {
                var DataAndwerArr = Data.info;
                document.querySelector('.vg-online-count').innerHTML = DataAndwerArr.countUsersUrl;
            }
            if (Data.type == 'showToken') {
                var DataAndwerArr = Data.info;
                setToken(DataAndwerArr.token, DataAndwerArr.nickname);
                updateAuth();
            }
            if (Data.type == 'showRemoveComment') {
                var DataAndwerArr = Data.info;
                var Elem = 'com_id_' + DataAndwerArr.id;
                if (document.getElementById(Elem)) {
                    document.getElementById(Elem).remove();
                }

            }
            if (Data.type == 'showComment') {
                var DataAndwerArr = Data.info;
                if (Array.isArray(DataAndwerArr)) {
                    DataAndwerArr.forEach(function (item, i, DataAndwerArr) {
                        //alert( i + ": " + item + " (массив:" + arr + ")" );
                        var ComType = 'other';
                        var ComRemove = '';
                        if (Nickname == item.nickname) {
                            ComType = 'my';
                            ComRemove = '<a href="#" data-id="' + item.message_id + '" class="com_remove_style com_remove">X</a> ';
                        }
                        if ('anonymous' == item.nickname) {
                            ComType = 'anonymous';
                            ComRemove = '<a href="#" data-id="' + item.message_id + '" class="com_remove_style com_remove_anonymous">X</a> ';
                        }
                        var com_id = '';
                        if (item.message_id > 0) {
                            com_id = 'com_id_' + item.message_id;
                        }
                        showMessage('<div id="' + com_id + '" data-id="' + item.message_id + '" class="chat-box-html ' + ComType + ' ' + item.message_type + '">' + ComRemove + '<span style="' + item.style_name + '" class="pc-user-nickname">' + item.nickname + '</span><span style="' + item.style_text + '" class="pc-user-comment">' + item.comment + '</span></div>');
                    });
                }
            }
            if (Data.type == 'showCheckToken') {
                var DataAndwerArr = Data.info;
                if (Data.error == 0) {
                    activeType('setComment');
                } else {
                    activeType('setLogin');
                }
                getComments();
            }
        } else {
            console.log('Error answer: ' + Data.data);
        }
    };

    websocket.onerror = function (event) {
        showMessage("<div class='error'>Problem due to some Error</div>");
        document.querySelector('.vg-pc-setBtnSend').style.display = 'none';
    };
    websocket.onclose = function (event) {
        showMessage("<div class='chat-connection-ack'>Connection Closed</div>");
        document.querySelector('.vg-pc-setBtnSend').style.display = 'none';
    };

    function getCurrent() {
        var messageJSON = {
            type: 'getCurrent',
            url: Url
        };
        websocket.send(JSON.stringify(messageJSON));
    }

    function getComments() {
        if (!LoadComments) {
            LoadComments = true;
            var messageJSON = {
                type: 'getComments'
            };
            websocket.send(JSON.stringify(messageJSON));
        }
    }

// setLogin, setRegister, setComment
    function activeType(type) {
        // hidden all
        var AllTypeArr = document.querySelectorAll('.typeBlock');
        document.querySelectorAll('.typeBlock').forEach(el => {
            el.style.display = 'none';
        });
        if (type == 'setLogin') {
            document.querySelector('.vg-pc-setLogin').style.display = 'block';

            document.querySelector('.btnRegister').style.display = '';
            document.querySelector('.btnLogin').style.display = '';
            document.querySelector('.btnExit').style.display = 'none';

            document.querySelector('.inputNickname').required = true;
            document.querySelector('.inputPassword').required = true;
            document.querySelector('.inputPassword2').required = false;
            document.querySelector('.inputComment').required = false;
        }
        if (type == 'setRegister') {
            document.querySelector('.vg-pc-setLogin').style.display = 'block';
            document.querySelector('.vg-pc-setRegister').style.display = 'block';

            document.querySelector('.btnRegister').style.display = '';
            document.querySelector('.btnLogin').style.display = '';
            document.querySelector('.btnExit').style.display = 'none';

            document.querySelector('.inputNickname').required = true;
            document.querySelector('.inputPassword').required = true;
            document.querySelector('.inputPassword2').required = true;
            document.querySelector('.inputComment').required = false;
        }
        if (type == 'setComment') {
            document.querySelector('.setUrl').value = Url;
            document.querySelector('.setToken').value = Token;
            document.querySelector('.vg-pc-setComment').style.display = 'block';

            if (Token) {
                document.querySelector('.btnRegister').style.display = 'none';
                document.querySelector('.btnLogin').style.display = 'none';
                document.querySelector('.btnExit').style.display = '';
            } else {
                document.querySelector('.btnRegister').style.display = '';
                document.querySelector('.btnLogin').style.display = '';
                document.querySelector('.btnExit').style.display = 'none';
            }

            document.querySelector('.inputNickname').required = false;
            document.querySelector('.inputPassword').required = false;
            document.querySelector('.inputPassword2').required = false;
            document.querySelector('.inputComment').required = true;

        }

        document.querySelector('.setType').value = type;
        document.querySelector('.vg-pc-setBtnSend').style.display = '';
    }

    function updateAuth() {
        Token = getToken();
        Nickname = getNickname();
        if (Token) {
            //console.log('checkToken '+Token);
            var messageJSON = {
                type: 'checkToken',
                token: Token,
            };
            websocket.send(JSON.stringify(messageJSON));
        } else {
            activeType('setComment');
            getComments();
        }
    }

    function setToken(token, nickname) {
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("token", token);
        return true;
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    function getNickname() {
        return localStorage.getItem("nickname");
    }

    function removeToken() {
        localStorage.removeItem("nickname");
        localStorage.removeItem("token");
        return true;
    }

    class Menu {
        handleEvent(event) {
            switch (event.type) {
                case 'submit':
                    submitFunction(event);
                    break;
                case 'click':
                    clickFunction(event);
                    break;
            }
        }
    }

    let menu = new Menu();
    document.addEventListener('submit', menu);
    document.addEventListener('click', menu);

    function submitFunction(event) {

        //event.preventDefault();
        var $this = event.target;

        if ($this.classList.contains("pageChat")) {

            var formData = new FormData($this);
            var object = {};
            formData.forEach(function (value, key) {
                object[key] = value;
            });


            websocket.send(JSON.stringify(object));
            document.querySelector(".inputComment").value = '';

            event.preventDefault();
            return false;
        } else {
            //return true;
        }
    }

    function clickFunction(event) {

        //event.preventDefault();
        var $this = event.target;

        if ($this.classList.contains("btnRegister")) {
            activeType('setRegister');
            return false;
        }
        if ($this.classList.contains("btnLogin")) {
            activeType('setLogin');
            return false;
        }
        if ($this.classList.contains("btnComment")) {
            activeType('setComment');
            return false;
        }
        if ($this.classList.contains("btnExit")) {
            Token = '';
            Nickname = '';
            document.querySelector('.setToken').value = Token;
            removeToken();
            activeType('setLogin');
            return false;
        }

        if ($this.classList.contains("com_remove")) {
            if (confirm('Delete comment for all?')) {
                if ($this.getAttribute('data-id') > 0) {
                    var messageJSON = {
                        type: 'removeComment',
                        id: $this.getAttribute('data-id'),
                        token: Token,
                    };
                    websocket.send(JSON.stringify(messageJSON));
                }
            }
            return false;
        }

        if ($this.classList.contains("com_remove_anonymous")) {
            if (confirm('Delete comment?')) {
                // $this.
                $this.closest(".chat-box-html").remove();
            }
            return false;
        }

        //return true;
    }


}






