# -*- coding: utf-8 -*-
import json

from django import forms
from django.db.models import Count
from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _

from booktypecontrol.forms import DefaultRolesForm
from booktype.apps.portal.forms import SpanErrorList
from booktype.apps.core.models import BookRole, Role
from booktype.apps.core.forms import BaseBooktypeForm
from booktype.utils import security
from booki.editor.models import (
    Language, Info, License, BookSetting, BookStatus)

from booki.editor.models import METADATA_FIELDS


class BaseSettingsForm(BaseBooktypeForm):
    success_url = None
    success_message = None
    required_permission = None

    def __init__(self, *args, **kwargs):
        kwargs.update({'error_class': SpanErrorList})
        self.book = kwargs.pop('book')
        super(BaseSettingsForm, self).__init__(*args, **kwargs)

    @classmethod
    def initial_data(cls, book=None, request=None):
        return None

    @classmethod
    def extra_context(cls, book=None, request=None):
        return {}

    @classmethod
    def has_perm(cls, book=None, request=None):
        if cls.required_permission:
            book_security = security.get_security_for_book(request.user, book)
            return book_security.has_perm(cls.required_permission)

        # if there no required permission, then True
        return True

    def save_settings(self, request):
        pass


class LanguageForm(BaseSettingsForm, forms.Form):
    language = forms.ModelChoiceField(
        label=_('Language'),
        queryset=Language.objects.all().order_by('name')
    )
    right_to_left = forms.BooleanField(
        label=_('Right to left text'),
        required=False,
        help_text=_("Book with right to left writing.")
    )
    skip_select_and_checkbox = True
    required_permission = 'edit.manage_language'

    @classmethod
    def initial_data(cls, book=None, request=None):
        try:
            rtl = Info.objects.get(book=book, kind=0, name='{http://booki.cc/}dir').getValue()
        except (Info.DoesNotExist, Info.MultipleObjectsReturned):
            rtl = 'LTR'

        return {
            'right_to_left': (rtl == 'RTL'),
            'language': book.language
        }

    def save_settings(self, book, request):
        book.language = self.cleaned_data['language']
        book.save()

        rtl_value = self.cleaned_data['right_to_left']
        rtl_value = "RTL" if rtl_value else "LTR"

        try:
            rtl = Info.objects.get(book=book, kind=0, name='{http://booki.cc/}dir')
            rtl.value_string = rtl_value
            rtl.save()
        except Info.DoesNotExist:
            rtl = Info(book=book, kind=0, name='{http://booki.cc/}dir', value_string=rtl_value)
            rtl.save()


class GeneralForm(BaseSettingsForm, forms.Form):
    track_changes = forms.BooleanField(
        label=_('Track changes'),
        required=False,
        help_text=_("Chapter changes will tracked.")
    )
    required_permission = 'edit.manage_book_settings'

    @classmethod
    def initial_data(cls, book=None, request=None):
        data = {}
        book_version = book.get_version()

        if book_version:
            data['track_changes'] = book_version.track_changes

        return data

    def save_settings(self, book, request):
        book_version = book.get_version()
        book_version.track_changes = self.cleaned_data['track_changes']
        book_version.save()


class ChapterStatusForm(BaseSettingsForm, forms.Form):
    name = forms.CharField(label=_('New Status'))
    required_permission = 'edit.manage_status'

    @classmethod
    def extra_context(cls, book, request):
        all_statuses = (BookStatus.objects
                        .filter(book=book)
                        .annotate(num_chapters=Count('chapter'))
                        .order_by('-weight'))

        return {
            'roles_permissions': security.get_user_permissions(request.user, book),
            'status_list': all_statuses,
        }


class LicenseForm(BaseSettingsForm, forms.Form):
    license = forms.ModelChoiceField(
        label=_('License'),
        queryset=License.objects.all().order_by("name")
    )
    skip_select_and_checkbox = True
    required_permission = 'edit.manage_license'

    @classmethod
    def initial_data(cls, book=None, request=None):
        return {
            'license': book.license
        }

    def save_settings(self, book, request):
        book.license = self.cleaned_data['license']
        book.save()

    def license_list(self):
        license_dict = {}
        for val in License.objects.all().values('id', 'url'):
            license_dict[val['id']] = val['url']
        return json.dumps(license_dict)


class ChapterStatus(BaseSettingsForm, forms.Form):
    pass


class MetadataForm(BaseSettingsForm, forms.Form):

    required_permission = 'edit.manage_metadata'

    def __init__(self, *args, **kwargs):
        super(MetadataForm, self).__init__(*args, **kwargs)

        for field, label, standard in METADATA_FIELDS:
            field_name = '%s.%s' % (standard, field)
            self.fields[field_name] = forms.CharField(
                label=label, required=False)

            c_field = self.fields[field_name]
            BaseBooktypeForm.apply_class(c_field, 'form-control')

            # apply widgets if needed
            if field in self.Meta.widgets:
                c_field.widget = self.Meta.widgets[field]

    class Meta:
        text_area = forms.Textarea(attrs={'class': 'form-control'})
        widgets = {
            'short_description': text_area,
            'long_description': text_area
        }

    @classmethod
    def initial_data(cls, book=None, request=None):
        initial = {}
        form_fields = ['%s.%s' % (f[2], f[0]) for f in METADATA_FIELDS]

        for meta in Info.objects.filter(book=book):
            if meta.name in form_fields:
                initial[meta.name] = meta.value_string

        return initial

    def save_settings(self, book, request):
        STRING = 0

        for key, value in self.cleaned_data.items():
            valid_value = self.cleaned_data.get(key, None)

            if key in self.fields.keys() and valid_value:
                meta, _ = Info.objects.get_or_create(
                    book=book, name=key,
                    kind=STRING
                )

                meta.value_string = value
                meta.save()


class RolesForm(BaseSettingsForm, forms.Form):
    required_permission = 'core.manage_roles'

    @classmethod
    def extra_context(cls, book=None, request=None):
        return {
            'roles': BookRole.objects.filter(book=book).order_by('role__name'),
            'global_roles': Role.objects.order_by('name'),
            'all_users': User.objects.order_by('username')
        }


class PermissionsForm(BaseSettingsForm, DefaultRolesForm):
    skip_select_and_checkbox = True
    required_permission = 'core.manage_permissions'

    @classmethod
    def initial_data(cls, book=None, request=None):
        initial = DefaultRolesForm.initial_data()

        for role_name in [cls.anonymous, cls.registered]:
            try:
                initial[role_name] = BookSetting.objects.get(
                    book=book, name='DEFAULT_ROLE_%s' % role_name
                ).get_value()
            except:
                pass

        return initial

    def save_settings(self, book, request):
        STRING = 0

        for key in [self.anonymous, self.registered]:
            value = self.cleaned_data.get(key, None)
            role_key = 'DEFAULT_ROLE_%s' % key
            if value:
                setting, _ = BookSetting.objects.get_or_create(
                    book=book, name=role_key, kind=STRING
                )
                setting.value_string = value
                setting.save()
