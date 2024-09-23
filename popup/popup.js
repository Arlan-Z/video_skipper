const btn = document.getElementById("btn");
btn.addEventListener('click', skip)

var expireDate;
async function getData() {
    const expireDateString = localStorage.getItem("expire_date");
    if (expireDateString) {
        expireDate = new Date(expireDateString);
    } else {
        await getToken();
        return; 
    }

    const daysLeft = (expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) await getToken(); 
}

async function getToken() {
    const data = await fetch('../cred.json')
        .then(response => response.json())
        .then(jsonData => jsonData);
    
    console.log(data);

    // Делаем POST запрос с данными из JSON
    const response = await fetch('https://uni-x.almv.kz/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            login: data.login,
            password: data.password,
        }),
    });

    if (!response.ok) {
        throw new Error('Error When Getting Token');
    }

    const responseData = await response.json();
    const token = responseData.token; // Предполагается, что токен возвращается в поле "token"
    // Сохраняем токен в localStorage
    localStorage.setItem('token', token);

    // Устанавливаем дату истечения токена
    const newExpireDate = new Date();
    newExpireDate.setDate(newExpireDate.getDate() + 7); // истекает через 7 дней
    localStorage.setItem('expire_date', newExpireDate.toISOString()); // Сохраняем в ISO формате
}

async function skip() {
    await getData();

    chrome.tabs.query({ active: true }, async function(tabs) {
        var tab = tabs[0];
        if (tab) {

            const lessonId = tab.url.split('/')[5]
            const url = `https://uni-x.almv.kz/api/lessons/${lessonId}/watched`
            // Получаем токен из localStorage
            var token = localStorage.getItem('token'); 
            if (!token) {
                alert("Token not found");
                return;
            }

            // Отправляем POST запрос
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token // Добавляем Bearer Token
                    },
                    body: JSON.stringify({ isWatched: true }) // Тело запроса
                });

                if (!response.ok) {
                    throw new Error('Error When Sending Request: ' + response.statusText);
                }

                chrome.tabs.reload(tab.id); 
                
            } catch (error) {
                alert('Error When Sending Request' + error);
            }
        } else {
            alert("An Error Occurred");
        }
    });
}