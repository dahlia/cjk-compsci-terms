function getGroupRows(term) {
  let rows = [];
  for (let row = term.parentNode.parentNode;
       row != null;
       row = row.previousElementSibling) {
    rows.push(row);
    if (row.classList.contains('group-head')) break;
  }
  for (let row = term.parentNode.parentNode.nextElementSibling;
       row != null && !row.classList.contains('group-head');
       row = row.nextElementSibling) {
    rows.push(row);
  }
  return rows;
}

function getHoverClasses(term) {
  return Array.from(term.classList)
    .filter(c => c.startsWith('correspond-'))
    .map(c => 'hover-' + c);
}

function onCorrespond() {
  let classes = getHoverClasses(this);
  for (let row of getGroupRows(this)) {
    row.className = Array.from(row.classList)
      .filter(c => !c.startsWith('hover-correspond-'))
      .concat(classes)
      .join(' ');
  }
}

function offCorrespond() {
  for (let row of getGroupRows(this)) {
    row.className = Array.from(row.classList)
      .filter(c => !c.startsWith('hover-correspond-'))
      .join(' ');
  }
}

Array.from(document.querySelectorAll('*[class*="correspond-"]'))
  .filter(e => e.className.match(/\bcorrespond-\d+\b/))
  .forEach(e => {
    e.addEventListener('mouseover', onCorrespond);
    e.addEventListener('mouseout', offCorrespond);
  });

const tocTitle = document.querySelector('#toc > div > h2').innerText.trim();

Array.from(document.querySelectorAll(':not(#toc > div) > h2, h3'))
  .forEach(h => {
    h.innerHTML +=
      ` <a class="toc" href="${location.pathname}#toc">${tocTitle}</a>`;
  });

// vim: set et sw=2 ts=2 sts=2 ft=javascript:
