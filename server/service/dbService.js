rooms = new Map();


module.exports = {
    getRoom: (id)=> {
        return rooms.get(id)
    },

    addRoom: (id, room) => {
      rooms.set(id, room);
    }
};