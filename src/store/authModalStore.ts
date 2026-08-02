import { makeAutoObservable } from "mobx";

class AuthModalStore {
    isOpen = false;

    constructor() {
        makeAutoObservable(this);
    }

    openModal = () => {
        this.isOpen = true;
    };

    closeModal = () => {
        this.isOpen = false;
    };
}

export const authModalStore = new AuthModalStore();