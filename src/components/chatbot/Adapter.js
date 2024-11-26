let adapter = {};

let type = 'local';

adapter.setType = function (newType) {
    type = newType;
}

adapter.getType = () => type;

export default adapter;