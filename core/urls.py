from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_redirect, name='index'),
    path('auth/', views.auth_view, name='auth'),
    path('auth/signin/', views.signin_view, name='signin'),
    path('auth/signup/', views.signup_view, name='signup'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('home/', views.home_view, name='home'),
    path('portfolio/', views.portfolio_overview, name='portfolio_overview'),
    path('portfolio/academic/', views.portfolio_academic, name='portfolio_academic'),
    path('portfolio/extracurricular/', views.portfolio_extracurricular, name='portfolio_extracurricular'),
    path('portfolio/awards/', views.portfolio_awards, name='portfolio_awards'),
    path('portfolio/subject/', views.portfolio_subject, name='portfolio_subject'),
    path('portfolio/complete/', views.portfolio_complete, name='portfolio_complete'),
    path('portfolio/save/', views.save_portfolio, name='save_portfolio'),
    path('portfolio/delete/', views.delete_portfolio, name='delete_portfolio'),
    path('analyzing/', views.analyzing_view, name='analyzing'),
    path('universities/', views.universities_view, name='universities'),
    path('university/<int:uni_id>/', views.university_detail, name='university_detail'),
    path('select-university/<int:uni_id>/', views.select_university, name='select_university'),
    path('planning/', views.planning_view, name='planning'),
    path('roadmap/', views.roadmap_view, name='roadmap'),
]
