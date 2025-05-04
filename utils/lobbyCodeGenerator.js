// Helper function to generate lobby name and password in the format "b" followed by 6 letters/digits
const generateLobbyCode = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'b';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

module.exports = { generateLobbyCode };
