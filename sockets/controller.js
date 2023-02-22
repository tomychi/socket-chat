const { Socket } = require('socket.io');
const { comprobarJWT } = require('../helpers');
const { ChatMensajes } = require('../models');

const chatMensajes = new ChatMensajes();

// new Socket NO SE DEBE HACER solo en desarrollo ( para ayudas )
const socketController = async (socket = new Socket(), io) => {
    const token = socket.handshake.headers['x-token'];

    const usuario = await comprobarJWT(token);

    if (!usuario) {
        return socket.disconnect();
    }

    // Agregar el usuario conectado
    chatMensajes.conectarUsuario(usuario);
    // el io es para todo el mundo
    io.emit('usuarios-activos', chatMensajes.usuariosArr);

    socket.emit('recibir-mensajes', chatMensajes.ultimos10);

    // conectarlo a una sala especial
    socket.join(usuario.id); // global, socket.id , usuario.id

    // limpiar cuando alguien se desconecta
    socket.on('disconnect', () => {
        chatMensajes.desconectarUsuario(usuario.id);
        io.emit('usuarios-activos', chatMensajes.usuariosArr);
    });

    socket.on('enviar-mensaje', ({ uid, mensaje }) => {
        if (uid) {
            // mensaje privado
            socket
                .to(uid)
                .emit('mensaje-privado', { de: usuario.nombre, mensaje });
        } else {
            chatMensajes.enviarMensaje(usuario.id, usuario.nombre, mensaje);
            io.emit('recibir-mensajes', chatMensajes.ultimos10);
        }
    });
};

module.exports = {
    socketController,
};
