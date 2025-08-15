import React, { useState } from 'react'
import useGetUserProfile from '@/hooks/useGetUserProfile';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AtSign, Bookmark, Grid3X3, Heart, MessageCircle, MoreHorizontal, Settings, UserPlus, Users } from 'lucide-react';
import { Avatar, Card, CardContent, Tabs } from '@mui/material';
import { AvatarFallback, AvatarImage } from './ui/avatar';

const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num?.toString() || "0"
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
  })
}

const Profile = () => {
  const params = useParams();
  const userId = params.id;
  useGetUserProfile(userId);
  const [activeTab, setActiveTab] = useState('posts');

  const { userProfile, user } = useSelector(store => store.auth);
  const [isFollowing, setIsFollowing] = useState(userProfile?.followers?.includes(user?._id) || false);

  const isMe = user?._id === userId;

  console.log("userId", userId);
  console.log("user?._id", user?._id);
  console.log("userProfile", userProfile?._id);


  const isLoggedInUserProfile = user?._id === userProfile?._id;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  }

  const displayedPost = activeTab === 'posts' ? userProfile?.posts : userProfile?.bookmarks;

  const TabButton = ({ value, children }) => (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors duration-150
        ${activeTab === value ? 'bg-slate-100 shadow-sm text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  );

  const renderPostCard = (post) => {
    const likes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
    const comments = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);
    const imageSrc = Array.isArray(post.image) ? post.image[0] : post.image;

    return (
      <Card
        key={post._id || post.id}
        className="group cursor-pointer overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-300"
      >
        {imageSrc ? (
          <div className="relative aspect-square overflow-hidden">
            <img
              src={imageSrc || '/placeholder.svg'}
              alt={post.caption || 'Post image'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-1">
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">{formatNumber(likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{formatNumber(comments)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-6 min-h-[200px] flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-200 transition-colors duration-300">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <p className="text-slate-700 font-medium text-sm leading-relaxed line-clamp-4">
                {post.caption}
              </p>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{formatNumber(likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{formatNumber(comments)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-4">
          <p className={`text-slate-700 text-sm leading-relaxed ${imageSrc ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {post.caption}
          </p>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>{formatDate(post.createdAt)}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {formatNumber(likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {formatNumber(comments)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 mt-2 w-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-slate-900">{userProfile?.username}</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex justify-center md:justify-start">
              <Avatar sx={{ width: 200, height: 200 }} src={userProfile?.profilePicture} alt="profilephoto" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">{userProfile?.username}</h2>
                <p className="text-slate-600 text-lg leading-relaxed">{userProfile?.bio}</p>
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 mb-6">
                <div className="text-center">
                  <div className="font-display font-bold text-xl text-slate-900">{userProfile?.posts.length}</div>
                  <div className="text-slate-500 text-sm">Bài viết</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-xl text-slate-900">
                    {formatNumber(userProfile?.followers.length)}
                  </div>
                  <div className="text-slate-500 text-sm">Người theo dõi</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-xl text-slate-900">{userProfile?.following.length}</div>
                  <div className="text-slate-500 text-sm">Đang theo dõi</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center md:justify-start gap-3">
                {!isMe &&
                  <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`px-6 ${isFollowing ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                  >
                    {isFollowing ? (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Đang theo dõi
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Theo dõi
                      </>
                    )}
                  </Button>}

                <Button variant="outline" className="px-6 bg-transparent">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Nhắn tin
                </Button>
              </div>

              {/* Profile Details */}
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  Tham gia {formatDate(userProfile?.createdAt)}
                </div>
                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                  {userProfile?.gender === "female" ? "Nữ" : "Nam"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="w-full">
          {/* Tabs header */}
          <div className="w-full">
            <div role="tablist" aria-label="Profile tabs" className="grid w-full grid-cols-3 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
              <TabButton value="posts">
                <Grid3X3 className="w-4 h-4" />
                Bài viết
              </TabButton>

              <TabButton value="bookmarks">
                <Bookmark className="w-4 h-4" />
                Đã lưu
              </TabButton>

              <TabButton value="tagged">
                <Users className="w-4 h-4" />
                Được gắn thẻ
              </TabButton>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === 'posts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(userProfile?.posts || []).map((post) => renderPostCard(post))}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(userProfile?.bookmarks || []).map((bookmark) => (
                  <Card
                    key={bookmark._id || bookmark.id}
                    className="group cursor-pointer overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={(Array.isArray(bookmark.image) ? bookmark.image[0] : bookmark.image) || '/placeholder.svg'}
                        alt={bookmark.caption || 'bookmark'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-slate-700 text-sm line-clamp-2 leading-relaxed">{bookmark.caption}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'tagged' && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-slate-900 mb-2">Chưa có bài viết được gắn thẻ</h3>
                <p className="text-slate-500">Các bài viết mà {userProfile?.username} được gắn thẻ sẽ hiển thị ở đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile