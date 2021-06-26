var rooms = {
  room1: 2,
  room2: 3,
  room3: 4,
  room4: 10,
};

for (roomKey in rooms) {
  console.log(`the number of people in ${roomKey} are ${rooms[roomKey]}`);
}
