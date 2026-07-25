function saveUserProfile(profile){
    try{
        sessionStorage.setItem('userProfile', JSON.stringify(profile));
        return true;
    } catch (error) {
        console.log('Save error ', error);
        return false;
    }
    
}

export { saveUserProfile };