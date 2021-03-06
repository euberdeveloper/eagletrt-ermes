function copy(type) {
    var input = document.createElement('input');
    var element= document.getElementById(type);
    input.setAttribute('value', port_number);
    document.body.appendChild(input);
    input.select();
    var risultato = document.execCommand('copy');
    document.body.removeChild(input);
    alert(type +' copiato: '+ element);
    return risultato;
}

