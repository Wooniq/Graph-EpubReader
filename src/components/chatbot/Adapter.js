let adapter = {};

let resMethod = 'local';
let resType = 'Single Sentence';

adapter.setResMethod= function (newResMethod) {
    resMethod = newResMethod;
}

adapter.setResType= function (newResType) {
    resType = newResType;
}

adapter.getResMethod = () => resMethod;

adapter.getResType = () => resType;

export default adapter;