from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib import messages
import json

from .models import UserProfile
from .data import (
    get_university_by_id, UNIVERSITIES, SUBJECT_AREAS
)


def get_or_create_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def index_redirect(request):
    if request.user.is_authenticated:
        return redirect('home')
    return redirect('auth')


def auth_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'auth.html')


def _parse_post(request):
    try:
        return json.loads(request.body)
    except Exception:
        return dict(request.POST)


def signin_view(request):
    if request.method == 'POST':
        data = _parse_post(request)
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=password)
            if user:
                login(request, user)
                return JsonResponse({'success': True, 'redirect': '/home/'})
            else:
                return JsonResponse({'success': False, 'error': 'Incorrect password.'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'No account with that email.'})
    return redirect('auth')


def signup_view(request):
    if request.method == 'POST':
        data = _parse_post(request)
        # Accept either 'name' or 'full_name'
        name = (data.get('name') or data.get('full_name') or '').strip()
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''
        if not name or not email or not password:
            return JsonResponse({'success': False, 'error': 'All fields are required.'})
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'An account with this email already exists.'})
        username = email.split('@')[0] + str(User.objects.count())
        user = User.objects.create_user(username=username, email=email, password=password, first_name=name)
        UserProfile.objects.create(user=user)
        login(request, user)
        return JsonResponse({'success': True, 'redirect': '/home/'})
    return redirect('auth')


def logout_view(request):
    logout(request)
    return redirect('auth')


@login_required
def home_view(request):
    profile = get_or_create_profile(request.user)
    has_portfolio = 'portfolio_data' in request.session
    return render(request, 'home.html', {
        'user': request.user,
        'has_portfolio': has_portfolio,
        'portfolio_count': profile.portfolio_count,
    })


@login_required
def portfolio_overview(request):
    portfolio = request.session.get('portfolio_data', {})
    return render(request, 'portfolio_overview.html', {
        'portfolio': portfolio,
        'subject_areas': SUBJECT_AREAS,
    })


@login_required
def portfolio_academic(request):
    portfolio = request.session.get('portfolio_data', {})
    return render(request, 'portfolio_academic.html', {'portfolio': portfolio})


@login_required
def portfolio_extracurricular(request):
    portfolio = request.session.get('portfolio_data', {})
    return render(request, 'portfolio_extracurricular.html', {'portfolio': portfolio})


@login_required
def portfolio_awards(request):
    portfolio = request.session.get('portfolio_data', {})
    return render(request, 'portfolio_awards.html', {'portfolio': portfolio})


@login_required
def portfolio_subject(request):
    portfolio = request.session.get('portfolio_data', {})
    return render(request, 'portfolio_subject.html', {
        'portfolio': portfolio,
        'subject_areas': SUBJECT_AREAS,
    })


@login_required
def portfolio_complete(request):
    portfolio = request.session.get('portfolio_data', {})
    if not portfolio:
        return redirect('portfolio_overview')
    return render(request, 'portfolio_complete.html', {'portfolio': portfolio})


@login_required
def save_portfolio(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except Exception:
            data = {}
        section = data.get('section')
        content = data.get('content', {})
        portfolio = request.session.get('portfolio_data', {})
        if section:
            portfolio[section] = content
        else:
            portfolio.update(data)
        request.session['portfolio_data'] = portfolio
        request.session.modified = True

        # If completing the portfolio, increment portfolio count
        if data.get('complete'):
            profile = get_or_create_profile(request.user)
            profile.portfolio_count += 1
            profile.save()

        return JsonResponse({'success': True})
    return JsonResponse({'success': False})


@login_required
def delete_portfolio(request):
    if request.method == 'POST':
        keys_to_delete = ['portfolio_data', 'selected_university_id']
        for key in keys_to_delete:
            request.session.pop(key, None)
        profile = get_or_create_profile(request.user)
        profile.selected_university_id = None
        profile.current_roadmap_id = None
        profile.save()
        return JsonResponse({'success': True, 'redirect': '/portfolio/'})
    return redirect('portfolio_overview')


@login_required
def analyzing_view(request):
    portfolio = request.session.get('portfolio_data', {})
    if not portfolio:
        return redirect('portfolio_overview')
    return render(request, 'analyzing.html', {'portfolio': portfolio})


@login_required
def universities_view(request):
    return render(request, 'universities.html', {
        'universities': UNIVERSITIES,
    })


@login_required
def university_detail(request, uni_id):
    uni = get_university_by_id(uni_id)
    if not uni:
        return redirect('universities')
    return render(request, 'university_detail.html', {'uni': uni})


@login_required
def select_university(request, uni_id):
    uni = get_university_by_id(uni_id)
    if not uni:
        return redirect('universities')
    profile = get_or_create_profile(request.user)
    profile.selected_university_id = uni_id
    profile.save()
    request.session['selected_university_id'] = uni_id
    return redirect('planning')


@login_required
def planning_view(request):
    uni_id = request.session.get('selected_university_id') or \
             getattr(get_or_create_profile(request.user), 'selected_university_id', None)
    if not uni_id:
        return redirect('universities')
    uni = get_university_by_id(uni_id)
    return render(request, 'planning.html', {'uni': uni})


@login_required
def roadmap_view(request):
    profile = get_or_create_profile(request.user)
    uni_id = request.session.get('selected_university_id') or profile.selected_university_id
    uni = get_university_by_id(uni_id) if uni_id else None
    return render(request, 'roadmap.html', {'uni': uni})
