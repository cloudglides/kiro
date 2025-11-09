{
  description = "Kiru - Screenshot Editor";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            gjs
            gtk3
            libsoup_2_4
            cairo
            pango
            gdk-pixbuf
            glib
            gnome-screenshot
            gobject-introspection
            curl
            wl-clipboard
            shared-mime-info
          ];

          shellHook = ''
            export GI_TYPELIB_PATH="${pkgs.gtk3}/lib/girepository-1.0:${pkgs.libsoup_2_4}/lib/girepository-1.0:${pkgs.gdk-pixbuf}/lib/girepository-1.0:${pkgs.cairo}/lib/girepository-1.0:${pkgs.glib}/lib/girepository-1.0:${pkgs.pango}/lib/girepository-1.0:$GI_TYPELIB_PATH"
            export GDK_PIXBUF_MODULE_FILE="${pkgs.gdk-pixbuf}/lib/gdk-pixbuf-2.0/2.10.0/loaders.cache"
          '';
        };
      });
}
