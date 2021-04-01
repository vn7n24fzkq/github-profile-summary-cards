module.exports = (req, res) => {
    throw new Error('Error test');
    res.send(`Hello!`);
};
