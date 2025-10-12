import JSDOM from "jsdom";

class DummyLocation {
hash = "";
host = "";
hostname = "";
href = "";
toString() { return this.href; }
origin = "";
pathname = "";
port = "";
protocol = "";
search = "";
assign(url) {
this.href = String(url);
}
reload() { }
replace(url) {
this.href = String(url);
}
}

export class JSDOMWithDummyLocation extends JSDOM.JSDOM {
_mockLocation = new DummyLocation();
_documentProxy = new Proxy(super["window"].document, {
get: (target, prop, receiver) => {
if (prop !== "location") return Reflect.get(target, prop, receiver);
return this._mockLocation;
},
});

_windowProxy = new Proxy(super["window"], {
get: (target, prop, receiver) => {
switch (prop) {
case "document": return this._documentProxy;
case "location": return this._mockLocation;
default: return Reflect.get(target, prop, receiver);
}
},
});

get window() {
return this._windowProxy;
}
}
