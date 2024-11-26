let adapter = {};

let resMethod = 'local';

adapter.setResMethod= function (newResMethod) {
    resMethod = newResMethod;
}

adapter.getResMethod = () => resMethod;

export default adapter;