var deleteBtn = document.getElementsByClassName('delete-btn');
var pwShowBtn = document.getElementsByClassName('show-password');


for (i = 0; i < deleteBtn.length; i++) {
  deleteBtn[i].addEventListener('click', function(e) {
    document.querySelector('.modal').style.display = 'flex';
  });
}

if(deleteBtn.length > 0) {
  document.querySelector('.close').addEventListener('click', function() {
    document.querySelector('.modal').style.display = 'none';
  });
}

for(i = 0; i < pwShowBtn.length; i++) {
  pwShowBtn[i].addEventListener('click', function() {
    document.querySelector('.pw-modal').style.display = 'flex';
  });
}

if(pwShowBtn.length > 0) {
  document.querySelector('.pw-close').addEventListener('click', function() {
    document.querySelector('.pw-modal').style.display = 'none';
  });
}
