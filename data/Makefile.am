# I chose to use recursive automake so I can use nobase_ and avoid
# 5 different directory declarations
SUBDIRS = icons

appsdir = $(datadir)/applications
apps_DATA = org.gnome.News.desktop

@INTLTOOL_DESKTOP_RULE@

gsettings_SCHEMAS = org.gnome.News.gschema.xml

@GSETTINGS_RULES@

appstream_XML = org.gnome.News.appdata.xml

@APPSTREAM_XML_RULES@
@INTLTOOL_XML_RULE@

org.gnome.News.service: org.gnome.News.service.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

servicedir = $(datadir)/dbus-1/services
service_DATA = org.gnome.News.service

EXTRA_DIST = \
	org.gnome.News.desktop.in \
	org.gnome.News.service.in \
	$(gsettings_SCHEMAS) \
	org.gnome.News.appdata.xml.in \
	$(app_resource_files) \
	$(NULL)

CLEANFILES = \
	org.gnome.News.service \
	org.gnome.News.appdata.xml \
	org.gnome.News.appdata.valid \
	$(apps_DATA) \
	*.valid \
	gschemas.compiled \
	$(NULL)

# For uninstalled use
all-local:
	$(GLIB_COMPILE_SCHEMAS) $(builddir)

-include $(top_srcdir)/git.mk
