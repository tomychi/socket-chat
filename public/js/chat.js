const url = window.location.hostname.includes('localhost')
    ? 'http://localhost:8080/api/auth/'
    : 'https://rest-server-node-curso-xd.herokuapp.com/api/auth/';

let usuario = null;
let socket = null;

// Referencias HTML
const d = document;
const txtUid = d.querySelector('#txtUid');
const txtMensaje = d.querySelector('#txtMensaje');
const ulUsuarios = d.querySelector('#ulUsuarios');
const ulMensajes = d.querySelector('#ulMensajes');
const btnSalir = d.querySelector('#btnSalir');

// validar el token del localstorage
const validarJWT = async () => {
    const token = localStorage.getItem('token') || '';
    if (token.length <= 10) {
        window.location = 'index.html'; // un componente en react q te redireccione
        throw new Error('No hay token en el servidor');
    }

    const resp = await fetch(url, {
        headers: { 'x-token': token },
    });

    const { usuario: userDB, token: tokenDB } = await resp.json();

    localStorage.setItem('token', tokenDB);
    usuario = userDB;
    d.title = usuario.nombre;

    await conectarSocket();
};

// conecta con nuestro server
const conectarSocket = async () => {
    socket = io({
        extraHeaders: {
            'x-token': localStorage.getItem('token'),
        },
    });

    socket.on('connect', () => {
        console.log('sockets online');
    });

    socket.on('disconnect', () => {
        console.log('sockets offline');
    });

    socket.on('recibir-mensajes', dibujarMensajes);

    socket.on('usuarios-activos', dibujarUsuarios);

    socket.on('mensaje-privado', (payload) => {
        //TODO:
        console.log('privado', payload);
    });
};

const dibujarUsuarios = (usuarios = []) => {
    let usersHtml = '';
    usuarios.forEach(({ nombre, uid }) => {
        usersHtml += `
        <li>
            <p>
                <h5 class="text-success"> ${nombre}</h5>
                <span class="fs-6 text-muted">${uid}</span>
            </p>
        </li>
        
        `;
    });

    ulUsuarios.innerHTML = usersHtml;
};

const dibujarMensajes = (mensajes = []) => {
    let mensajesHtml = '';
    mensajes.forEach(({ nombre, mensaje }) => {
        mensajesHtml += `
        <li>
            <p>
                <span class="text-primary"> ${nombre}</span>
                <spancontro>${mensaje}</spancontro>
            </p>
        </li>
        
        `;
    });

    ulMensajes.innerHTML = mensajesHtml;
};

txtMensaje.addEventListener('keyup', ({ keyCode }) => {
    const mensaje = txtMensaje.value;
    const uid = txtUid.value;

    if (keyCode !== 13) return;
    if (mensaje.length === 0) return;

    socket.emit('enviar-mensaje', { uid, mensaje });

    txtMensaje.value = '';
});

const main = async () => {
    // validar JWT
    await validarJWT();
};

main();
