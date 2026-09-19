export class DarallaParent extends JSWindowActorParent {
  receiveMessage(message) {
    const browser = this.browsingContext?.top?.embedderElement;
    const win = browser?.ownerGlobal;
    if (message.name === "Daralla:Scrolled") {
      win?.darallaOnPageScroll?.(browser, message.data);
    } else if (message.name === "Daralla:Painted") {
      win?.darallaOnPagePainted?.(browser);
    }
  }
}
