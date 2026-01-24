export default function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  );
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) {
    return arr;
  }
}

function _iterableToArrayLimit(arr, i) {
  if (arr == null) {
    return;
  }
  var iterator = arr[Symbol.iterator] || arr["@@iterator"];
  if (iterator == null) {
    return;
  }
  var _arr = [];
  var done = true;
  var didErr = false;
  var err;
  try {
    for (iterator = iterator.call(arr); !(done = (iterator.next()).done); done = true) {
      _arr.push(iterator.value);
      if (i && _arr.length === i) {
        break;
      }
    }
  } catch (error) {
    didErr = true;
    err = error;
  } finally {
    try {
      if (!done && iterator["return"] != null) {
        iterator["return"]();
      }
    } finally {
      if (didErr) {
        throw err;
      }
    }
  }
  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) {
    return;
  }
  if (typeof o === "string") {
    return _arrayLikeToArray(o, minLen);
  }
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) {
    n = o.constructor.name;
  }
  if (n === "Map" || n === "Set") {
    return Array.from(o);
  }
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) {
    return _arrayLikeToArray(o, minLen);
  }
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) {
    len = arr.length;
  }
  for (var i = 0, arr2 = new Array(len); i < len; i += 1) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.");
}
