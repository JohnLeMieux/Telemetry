let data = [],
    sortDirection = true;
const socket = new WebSocket('ws://localhost:8080/realtime')

// generates a table row from a telemetry data entry
const getRow = (json) => {
    let tr = document.createElement('tr');
    let id = document.createElement('td');
    id.innerText = json.id;
    tr.appendChild(id);
    let timestamp = document.createElement('td');
    timestamp.innerText = new Date(json.timestamp).toISOString();
    tr.appendChild(timestamp);
    let value = document.createElement('td');
    value.innerText = json.value;
    tr.appendChild(value);
    return tr;
}

// adds a telemetry data entry to the table sorted in the appropriate order
// also adds the data to the persistent data array and deletes the oldest entry
//     to avoid increasing size
socket.addEventListener('message', e => {
    let json = JSON.parse(e.data);
    let tbody = document.getElementsByTagName('tbody')[0];
    let tr = getRow(json);
    if (sortDirection) {
        if (tbody)
            tbody.appendChild(tr);
        data.push(json);
        data.shift();
    } else {
        if (tbody)
            tbody.insertBefore(tr, tbody.firstChild);
        data.unshift(json);
        data.pop();
    }
})

const setState = (point, checked) => {
    checked ? getData(point) : clearTable(point);
}

const getData = point => {
    let end = new Date();
    let start = new Date(end);
    start.setMinutes(start.getMinutes() - 15);
    fetch('/history/' + point + '?start=' + start.getTime() + '&end=' + end.getTime())
        .then(response => {
            return response.json();
        })
        .then(array => {
            data = data.concat(array);
            data.sort((a, b) => {
                return a.timestamp - b.timestamp;
            });
            renderTable();
        });
    socket.send('subscribe ' + point);
}

const renderTable = () => {
    let tbody = document.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error("ERROR: No parent element");
        return;
    }
    tbody.innerHTML = '';
    data.forEach(json => {
        tbody.appendChild(getRow(json));
    });
}

const clearTable = point => {
    socket.send('unsubscribe ' + point);
    data = data.filter(value => {
        return value.id != point;
    });
    renderTable();
}

const changeSort = () => {
    sortDirection = !sortDirection;
    data.reverse();
    renderTable();
}