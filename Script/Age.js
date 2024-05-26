// Calculate age if necessary
if (document.querySelector("[data-birthday]")) calculateAge();

// Calculate age from birthday date
function calculateAge() {
  var ageField = document.querySelector("[data-birthday]");
  var birthday = ageField.getAttribute("data-birthday");

  var birthdayArray = birthday.split("/");

  var birthDay = Number(birthdayArray[0]);
  var birthMonth = Number(birthdayArray[1]);
  var birthYear = Number(birthdayArray[2]);

  var age = getAge(birthYear, birthMonth, birthDay);

  ageField.innerHTML = age;
  
  function getAge(birthYear, birthMonth, birthDay) {
    var today = new Date();
    
    var todayYear = today.getFullYear();
    var todayMonth = today.getMonth() + 1;
    var todayDay = today.getDate();
    
    let age = todayYear - birthYear;

    if (todayMonth > birthMonth) {
      return age;
    } else if (todayDay > birthDay && todayMonth === birthMonth) {
      return age;
    } else if (todayDay < birthDay && todayMonth === birthMonth) {
      age = age - 1;
      return age;
    } else if (todayDay === birthDay && todayMonth === birthMonth) {
      return age;
    } else if (todayMonth < birthMonth) {
      age = age - 1;
      return age;
    }
  }
}
