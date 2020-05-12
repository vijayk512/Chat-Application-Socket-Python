document.addEventListener('DOMContentLoaded', () => {

    // Initializing a socket for open communication.
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    document.querySelector('#channel-name').value = '';
    socket.on('connect', () => {
        document.querySelector('#add-channel').onclick = () => {

            const channel_name = document.querySelector('#channel-name').value;
            socket.emit('add channel', {'channel_name': channel_name});

            var elem = document.querySelector('.alert-success');
                elem.style.display = 'none';
        };
        // sending a message to socket and server side as well.
        document.querySelector('#send-message').onclick = () => {
            const user_message = document.querySelector('#message').value;
            let timestamp = new Date;
            socket.emit('add message', {'channel_name': localStorage.getItem('active_channel'), 'user_message': user_message, 'timestamp': timestamp});
            document.querySelector('#message').value = '';
        };

    });
    // creating a channels and adding in list as well.
    socket.on('all channels', data => {
        const div = document.createElement('div');
        div.innerHTML = `${data.channel_name}`;
        div.setAttribute('data-name', `${data.channel_name}`);
        div.setAttribute('class', "list-group list-group-flush channelall");
        document.querySelector('#new-channel').append(div);



        const p = document.createElement('p');
        p.innerHTML = `${data.channel_name} channel is created`;
        p.setAttribute('class', 'alert alert-success');
        document.querySelector('.modal-body').append(p);

    });

    //This one is announce message, which channel has new message.
    socket.on('announce message', data => {
        const div = document.createElement('div');
        div.setAttribute('class', "chat-message");
        div.innerHTML = `<b>${data.username}:</b> ${data.user_message} <span>${data.timestamp}</span>`;
        document.querySelector('#user_messages').append(div);
    });


    // checking if channel name is existing.
    socket.on('error channels', data => {
        const p = document.createElement('p');
        p.innerHTML = `${data.channel_name} channel is already existing!`;
        p.setAttribute('class', 'alert alert-danger');
        document.querySelector('.modal-body').append(p);
    });

    //  remeber the last active channel and get all chat from it.
    if(localStorage.getItem('active_channel')){
        channel_n = localStorage.getItem('active_channel');
        document.querySelector('#messages-c').innerHTML = `Messages from ${channel_n}`;
        getChat();
    }


});

//click event for getting a messages.
document.addEventListener('click', () => {
    document.querySelectorAll('.channelall').forEach(channel => {

        channel.onclick = () => {
            const channel_name = channel.dataset.name;
            document.querySelector('#messages-c').innerHTML = `Messages from ${channel_name}`;
            localStorage.setItem('active_channel', channel_name);
            document.querySelector('#send-message').disabled = false;
            document.querySelector('#user_messages').innerHTML = '';
            getChat();
        };
    });
})


// making ajax call to get all char from particular channels
function getChat(){
    const request = new XMLHttpRequest();
    request.open('POST', '/chat');
    request.onload = () => {
        const data = JSON.parse(request.responseText);
        data.forEach(add_message);
    };

    const data = new FormData();
    data.append('channel_name', localStorage.getItem('active_channel'));

    request.send(data);
}

// created a template for existing messages and adding a data to it.
const post_template = Handlebars.compile(document.querySelector('#old-chat').innerHTML);

function add_message(contents) {
    const post = post_template({"name": contents[0], 'message': contents[1] ,'time': contents[2]});
    document.querySelector('#user_messages').innerHTML += post;
}